cask "shellfire" do
  version "1.0.0"
  sha256 :no_check

  url "https://github.com/suvash-glitch/Shellfire/releases/download/v#{version}/Shellfire-#{version}.dmg"
  name "Shellfire"
  desc "A modern terminal multiplexer built with Electron"
  homepage "https://github.com/suvash-glitch/Shellfire"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Shellfire.app"

  zap trash: [
    "~/Library/Application Support/Shellfire",
    "~/Library/Preferences/com.shellfire.app.plist",
    "~/Library/Caches/com.shellfire.app",
    "~/Library/Logs/Shellfire",
  ]
end
