package version

import (
	"fmt"
	"runtime"
)

var (
	Version = "1.0.0"

	GitCommit = "unknown"

	BuildDate = "unknown"

	GoVersion = runtime.Version()
)

func Info() string {
	return fmt.Sprintf("OnWapp v%s (commit: %s, built: %s, %s)",
		Version, GitCommit, BuildDate, GoVersion)
}

func Short() string {
	return Version
}

func Full() map[string]string {
	return map[string]string{
		"version":    Version,
		"git_commit": GitCommit,
		"build_date": BuildDate,
		"go_version": GoVersion,
		"os":         runtime.GOOS,
		"arch":       runtime.GOARCH,
	}
}
