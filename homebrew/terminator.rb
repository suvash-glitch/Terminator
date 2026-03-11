cask "terminator" do
  version "1.0.0"
  sha256 :no_check

  url "https://github.com/suvash-glitch/Terminator/releases/download/v#{version}/Terminator-#{version}.dmg"
  name "Terminator"
  desc "A modern terminal multiplexer built with Electron"
  homepage "https://github.com/suvash-glitch/Terminator"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Terminator.app"

  zap trash: [
    "~/Library/Application Support/Terminator",
    "~/Library/Preferences/com.terminator.app.plist",
    "~/Library/Caches/com.terminator.app",
    "~/Library/Logs/Terminator",
  ]
end
