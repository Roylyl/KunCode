using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

internal static class KunCodeUninstallerLauncher
{
    [STAThread]
    private static int Main(string[] args)
    {
        string directory = AppDomain.CurrentDomain.BaseDirectory;
        string uninstaller = Path.Combine(directory, "unins000.exe");
        if (!File.Exists(uninstaller))
        {
            return 2;
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = uninstaller,
            Arguments = string.Join(" ", args.Select(Quote)),
            UseShellExecute = true,
            WorkingDirectory = directory
        };

        Process.Start(startInfo);
        return 0;
    }

    private static string Quote(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "\"\"";
        }

        return value.IndexOfAny(new[] { ' ', '\t', '\"' }) < 0
            ? value
            : "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }
}
