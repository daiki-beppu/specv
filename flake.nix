{
  description = "specv — local Markdown preview dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          # Node.js and pnpm come from Vite+ (vp); see .node-version and packageManager.
          packages = with pkgs; [
            lefthook
            git
          ];

          shellHook = ''
            if [ -d .git ]; then
              ${pkgs.lefthook}/bin/lefthook install --force > /dev/null
            fi
          '';
        };
      });
}
