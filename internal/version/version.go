package version

import (
	"fmt"
	"runtime"
)

var (
	// Version is the semantic version (set by build flags)
	Version = "0.2.8"

	// GitCommit is the git commit hash (set by build flags)
	GitCommit = "unknown"

	// BuildDate is the build date (set by build flags)
	BuildDate = "unknown"

	// GoVersion is the Go version used to build
	GoVersion = runtime.Version()
)

// Info returns version information as a formatted string
func Info() string {
	return fmt.Sprintf("OnWapp v%s (commit: %s, built: %s, %s)",
		Version, GitCommit, BuildDate, GoVersion)
}

// Short returns just the version number
func Short() string {
	return Version
}

// Full returns all version details as a map
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
