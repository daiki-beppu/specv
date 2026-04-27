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
          packages = with pkgs; [
            nodejs_24
            pnpm
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
