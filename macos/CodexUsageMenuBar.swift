import AppKit
import Foundation

struct MenuBarConfig: Decodable {
    let cliPath: String?
    let repoRoot: String?
    let defaultReportDir: String?
    let source: String?
}

struct DailyUsage {
    let date: String
    let totalTokens: Int
    let eventCount: Int
    let featureCounts: [String: Int]
}

struct FeatureTotal {
    let name: String
    let count: Int
}

struct ProcessResult {
    let status: Int32
    let stdout: String
    let stderr: String
}

struct UsageSnapshot {
    let status: String
    let lifetimeTokens: Int
    let activeDays: Int
    let latestStreak: Int
    let longestStreak: Int
    let peakDailyTokens: Int
    let peakDailyDate: String
    let topFeatures: [FeatureTotal]
    let dateRange: String
    let generatedAt: String
    let reportPath: String
    let error: String?

    func jsonObject() -> [String: Any] {
        return [
            "status": status,
            "lifetimeTokens": lifetimeTokens,
            "activeDays": activeDays,
            "latestStreak": latestStreak,
            "longestStreak": longestStreak,
            "peakDailyTokens": peakDailyTokens,
            "peakDailyDate": peakDailyDate,
            "topFeatures": topFeatures.map { ["name": $0.name, "count": $0.count] },
            "dateRange": dateRange,
            "generatedAt": generatedAt,
            "reportPath": reportPath,
            "error": error ?? NSNull()
        ]
    }
}

final class UsageCollector {
    private let fileManager = FileManager.default
    private let config: MenuBarConfig
    private let env: [String: String]
    private let debugEnabled: Bool
    private let isoOutput = ISO8601DateFormatter()
    private(set) var diagnostics: [String] = []

    init(debugEnabled: Bool = false) {
        self.debugEnabled = debugEnabled
        self.env = ProcessInfo.processInfo.environment
        self.config = UsageCollector.loadConfig(env: env)
        isoOutput.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        isoOutput.timeZone = .current
    }

    func collect() -> UsageSnapshot {
        diagnostics = []
        let reportDir = configuredReportDir()

        guard let cliPath = configuredCliPath(), fileManager.fileExists(atPath: cliPath) else {
            return emptySnapshot(status: "Unavailable", reportDir: reportDir, error: "dist/cli.js was not found. Run pnpm build first.")
        }

        var args = ["scan", "--json"]
        appendSourceArgs(to: &args)
        let result = runCli(cliPath: cliPath, args: args)
        if debugEnabled {
            diagnostics.append("scan exit=\(result.status)")
            diagnostics.append("scan stderr=\(result.stderr.trimmingCharacters(in: .whitespacesAndNewlines))")
        }
        guard result.status == 0 else {
            return emptySnapshot(status: "Error", reportDir: reportDir, error: result.stderr.trimmingCharacters(in: .whitespacesAndNewlines))
        }

        do {
            let days = try parseDailyUsage(result.stdout)
            return snapshot(from: days, reportDir: reportDir)
        } catch {
            return emptySnapshot(status: "Error", reportDir: reportDir, error: "Could not parse scan JSON: \(error.localizedDescription)")
        }
    }

    func generateReport() -> ProcessResult {
        guard let cliPath = configuredCliPath() else {
            return ProcessResult(status: 1, stdout: "", stderr: "dist/cli.js was not found. Run pnpm build first.")
        }
        var args = ["report", "--out", configuredReportDir()]
        appendSourceArgs(to: &args)
        return runCli(cliPath: cliPath, args: args)
    }

    func generateSampleReport() -> ProcessResult {
        guard let cliPath = configuredCliPath() else {
            return ProcessResult(status: 1, stdout: "", stderr: "dist/cli.js was not found. Run pnpm build first.")
        }
        let outDir = repoRoot().appendingPathComponent("tmp/menu-bar-sample-report").path
        return runCli(cliPath: cliPath, args: ["sample", "--out", outDir])
    }

    func configuredReportDir() -> String {
        if let value = nonEmpty(env["CODEX_USAGE_REPORT_DIR"]) {
            return expandPath(value)
        }
        if let value = nonEmpty(config.defaultReportDir) {
            return expandPath(value)
        }
        return repoRoot().appendingPathComponent("tmp/menu-bar-report").path
    }

    func repoRoot() -> URL {
        if let value = nonEmpty(env["CODEX_USAGE_HEATMAP_REPO_ROOT"]) ?? nonEmpty(config.repoRoot) {
            return URL(fileURLWithPath: expandPath(value))
        }
        return URL(fileURLWithPath: fileManager.currentDirectoryPath)
    }

    private static func loadConfig(env: [String: String]) -> MenuBarConfig {
        if let resourceURL = Bundle.main.resourceURL?.appendingPathComponent("config.json"),
           let data = try? Data(contentsOf: resourceURL),
           let decoded = try? JSONDecoder().decode(MenuBarConfig.self, from: data) {
            return decoded
        }
        return MenuBarConfig(
            cliPath: env["CODEX_USAGE_HEATMAP_CLI"],
            repoRoot: env["CODEX_USAGE_HEATMAP_REPO_ROOT"],
            defaultReportDir: env["CODEX_USAGE_REPORT_DIR"],
            source: env["CODEX_USAGE_SOURCE"]
        )
    }

    private func configuredCliPath() -> String? {
        if let value = nonEmpty(env["CODEX_USAGE_HEATMAP_CLI"]) {
            return expandPath(value)
        }
        if let value = nonEmpty(config.cliPath) {
            return expandPath(value)
        }
        let fallback = repoRoot().appendingPathComponent("dist/cli.js").path
        return fallback
    }

    private func appendSourceArgs(to args: inout [String]) {
        if let source = nonEmpty(env["CODEX_USAGE_SOURCE"]) ?? nonEmpty(config.source) {
            args.append("--source")
            args.append(expandPath(source))
        }
    }

    private func runCli(cliPath: String, args: [String]) -> ProcessResult {
        var processArgs: [String]
        let executable: String
        if let node = nonEmpty(env["NODE_BINARY"]) {
            executable = expandPath(node)
            processArgs = [cliPath] + args
        } else {
            executable = "/usr/bin/env"
            processArgs = ["node", cliPath] + args
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = processArgs
        process.currentDirectoryURL = repoRoot()
        process.environment = env

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        do {
            try process.run()
        } catch {
            return ProcessResult(status: 1, stdout: "", stderr: error.localizedDescription)
        }
        process.waitUntilExit()

        let stdout = String(data: stdoutPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        let stderr = String(data: stderrPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        return ProcessResult(status: process.terminationStatus, stdout: stdout, stderr: stderr)
    }

    private func parseDailyUsage(_ text: String) throws -> [DailyUsage] {
        guard let data = text.data(using: .utf8),
              let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let rows = root["dailyUsage"] as? [[String: Any]] else {
            return []
        }
        return rows.compactMap { row in
            guard let date = row["date"] as? String else { return nil }
            return DailyUsage(
                date: date,
                totalTokens: intValue(row["totalTokens"]),
                eventCount: intValue(row["eventCount"]),
                featureCounts: featureCounts(row["featureCounts"])
            )
        }
    }

    private func snapshot(from days: [DailyUsage], reportDir: String) -> UsageSnapshot {
        let activeDays = days.filter { $0.totalTokens > 0 }.count
        let lifetimeTokens = days.reduce(0) { $0 + $1.totalTokens }
        let peak = days.max { left, right in
            if left.totalTokens == right.totalTokens {
                return left.date > right.date
            }
            return left.totalTokens < right.totalTokens
        }
        let streaks = streakStats(days)
        let features = topFeatures(days)
        let dateRange = days.isEmpty ? "No usage data" : "\(days.first?.date ?? "Unknown") to \(days.last?.date ?? "Unknown")"

        return UsageSnapshot(
            status: days.isEmpty ? "No Data" : "Ready",
            lifetimeTokens: lifetimeTokens,
            activeDays: activeDays,
            latestStreak: streaks.latest,
            longestStreak: streaks.longest,
            peakDailyTokens: peak?.totalTokens ?? 0,
            peakDailyDate: peak?.date ?? "Unknown",
            topFeatures: features,
            dateRange: dateRange,
            generatedAt: isoOutput.string(from: Date()),
            reportPath: URL(fileURLWithPath: reportDir).appendingPathComponent("index.html").path,
            error: nil
        )
    }

    private func emptySnapshot(status: String, reportDir: String, error: String?) -> UsageSnapshot {
        return UsageSnapshot(
            status: status,
            lifetimeTokens: 0,
            activeDays: 0,
            latestStreak: 0,
            longestStreak: 0,
            peakDailyTokens: 0,
            peakDailyDate: "Unknown",
            topFeatures: [],
            dateRange: "No usage data",
            generatedAt: isoOutput.string(from: Date()),
            reportPath: URL(fileURLWithPath: reportDir).appendingPathComponent("index.html").path,
            error: error
        )
    }

    private func streakStats(_ days: [DailyUsage]) -> (latest: Int, longest: Int) {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"

        var currentRun = 0
        var latestActiveRun = 0
        var longest = 0
        var previousActiveDate: Date?

        for day in days.sorted(by: { $0.date < $1.date }) {
            guard let date = formatter.date(from: day.date) else { continue }
            if day.totalTokens <= 0 {
                currentRun = 0
                previousActiveDate = nil
                continue
            }

            if let previousActiveDate,
               Calendar(identifier: .gregorian).dateComponents([.day], from: previousActiveDate, to: date).day == 1 {
                currentRun += 1
            } else {
                currentRun = 1
            }
            previousActiveDate = date
            latestActiveRun = currentRun
            longest = max(longest, currentRun)
        }

        return (latestActiveRun, longest)
    }

    private func topFeatures(_ days: [DailyUsage]) -> [FeatureTotal] {
        var totals: [String: Int] = [:]
        for day in days {
            for (feature, count) in day.featureCounts {
                totals[feature, default: 0] += count
            }
        }
        return totals.map { FeatureTotal(name: $0.key, count: $0.value) }
            .sorted {
                if $0.count == $1.count {
                    return $0.name < $1.name
                }
                return $0.count > $1.count
            }
    }

    private func featureCounts(_ value: Any?) -> [String: Int] {
        guard let record = value as? [String: Any] else { return [:] }
        var counts: [String: Int] = [:]
        for (key, value) in record {
            counts[key] = intValue(value)
        }
        return counts
    }

    private func intValue(_ value: Any?) -> Int {
        if let int = value as? Int { return int }
        if let double = value as? Double { return Int(double) }
        if let string = value as? String, let int = Int(string) { return int }
        return 0
    }

    private func nonEmpty(_ value: String?) -> String? {
        guard let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
            return nil
        }
        return trimmed
    }

    private func expandPath(_ value: String) -> String {
        return NSString(string: value).expandingTildeInPath
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private let collector = UsageCollector()
    private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private var timer: Timer?
    private var lastSnapshot: UsageSnapshot?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        statusItem.button?.title = "CUH ..."
        refresh()
        timer = Timer.scheduledTimer(withTimeInterval: pollInterval(), repeats: true) { [weak self] _ in
            self?.refresh()
        }
    }

    private func pollInterval() -> TimeInterval {
        let raw = ProcessInfo.processInfo.environment["CODEX_USAGE_MENU_POLL_INTERVAL"].flatMap(Double.init) ?? 60
        return min(3600, max(15, raw))
    }

    @objc private func refreshNow() {
        refresh()
    }

    private func refresh() {
        statusItem.button?.title = "CUH refreshing"
        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self else { return }
            let snapshot = self.collector.collect()
            DispatchQueue.main.async {
                self.lastSnapshot = snapshot
                self.statusItem.button?.title = self.title(for: snapshot)
                self.statusItem.menu = self.menu(for: snapshot)
            }
        }
    }

    private func title(for snapshot: UsageSnapshot) -> String {
        if snapshot.error != nil {
            return "CUH Error"
        }
        if snapshot.status == "No Data" {
            return "CUH No Data"
        }
        return "CUH \(compact(snapshot.lifetimeTokens))"
    }

    private func menu(for snapshot: UsageSnapshot) -> NSMenu {
        let menu = NSMenu()
        addDisabled("Status: \(snapshot.status)", to: menu)
        addDisabled("Lifetime tokens: \(decimal(snapshot.lifetimeTokens))", to: menu)
        addDisabled("Active days: \(decimal(snapshot.activeDays))", to: menu)
        addDisabled("Latest streak: \(decimal(snapshot.latestStreak)) days", to: menu)
        addDisabled("Longest streak: \(decimal(snapshot.longestStreak)) days", to: menu)
        addDisabled("Peak daily: \(decimal(snapshot.peakDailyTokens)) on \(snapshot.peakDailyDate)", to: menu)
        addDisabled("Top features: \(featureSummary(snapshot.topFeatures))", to: menu)
        addDisabled("Date range: \(snapshot.dateRange)", to: menu)
        if let error = snapshot.error, !error.isEmpty {
            addDisabled("Error: \(error)", to: menu)
        }
        menu.addItem(NSMenuItem.separator())
        menu.addItem(actionItem("Refresh", action: #selector(refreshNow), keyEquivalent: "r"))
        menu.addItem(actionItem("Generate & Open Report", action: #selector(generateAndOpenReport), keyEquivalent: "o"))
        menu.addItem(actionItem("Open Last Report", action: #selector(openLastReport), keyEquivalent: "l"))
        menu.addItem(actionItem("Open Sample Report", action: #selector(openSampleReport), keyEquivalent: "s"))
        menu.addItem(actionItem("Open Project Folder", action: #selector(openProjectFolder), keyEquivalent: "p"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(actionItem("Quit", action: #selector(quit), keyEquivalent: "q"))
        return menu
    }

    private func actionItem(_ title: String, action: Selector, keyEquivalent: String) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: keyEquivalent)
        item.target = self
        return item
    }

    private func addDisabled(_ title: String, to menu: NSMenu) {
        let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        item.isEnabled = false
        menu.addItem(item)
    }

    @objc private func generateAndOpenReport() {
        statusItem.button?.title = "CUH report"
        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self else { return }
            let result = self.collector.generateReport()
            DispatchQueue.main.async {
                if result.status == 0 {
                    NSWorkspace.shared.open(URL(fileURLWithPath: self.collector.configuredReportDir()).appendingPathComponent("index.html"))
                    self.refresh()
                } else {
                    self.statusItem.button?.title = "CUH Error"
                }
            }
        }
    }

    @objc private func openLastReport() {
        let path = lastSnapshot?.reportPath ?? URL(fileURLWithPath: collector.configuredReportDir()).appendingPathComponent("index.html").path
        NSWorkspace.shared.open(URL(fileURLWithPath: path))
    }

    @objc private func openSampleReport() {
        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self else { return }
            let result = self.collector.generateSampleReport()
            DispatchQueue.main.async {
                if result.status == 0 {
                    let url = self.collector.repoRoot().appendingPathComponent("tmp/menu-bar-sample-report/index.html")
                    NSWorkspace.shared.open(url)
                } else {
                    self.statusItem.button?.title = "CUH Error"
                }
            }
        }
    }

    @objc private func openProjectFolder() {
        NSWorkspace.shared.open(collector.repoRoot())
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }

    private func decimal(_ value: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: value)) ?? String(value)
    }

    private func compact(_ value: Int) -> String {
        if value >= 1_000_000_000 {
            return String(format: "%.1fB", Double(value) / 1_000_000_000)
        }
        if value >= 1_000_000 {
            return String(format: "%.1fM", Double(value) / 1_000_000)
        }
        if value >= 1_000 {
            return String(format: "%.1fK", Double(value) / 1_000)
        }
        return String(value)
    }

    private func featureSummary(_ features: [FeatureTotal]) -> String {
        if features.isEmpty {
            return "No local evidence"
        }
        return features.prefix(2).map { "\($0.name) (\($0.count))" }.joined(separator: ", ")
    }
}

func printSnapshot(_ snapshot: UsageSnapshot) {
    let object = snapshot.jsonObject()
    let data = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys])
    if let data, let text = String(data: data, encoding: .utf8) {
        print(text)
    }
}

let args = Set(CommandLine.arguments.dropFirst())
let debugEnabled = args.contains("--debug") || args.contains("--verbose")
if args.contains("--once") {
    let collector = UsageCollector(debugEnabled: debugEnabled)
    let snapshot = collector.collect()
    printSnapshot(snapshot)
    if debugEnabled {
        for line in collector.diagnostics {
            fputs("[debug] \(line)\n", stderr)
        }
    }
    if snapshot.error != nil {
        exit(1)
    }
} else {
    let app = NSApplication.shared
    let delegate = AppDelegate()
    app.delegate = delegate
    app.run()
}
