set shell := ["bash", "-uc"]

serve:
    zola serve --open

build:
    zola build

check:
    zola check

all: check build

# Pin the tellus submodule to a release tag, e.g. `just pin-tellus tellus-v0.3.2`.
pin-tellus tag:
    git -C tellus fetch --tags
    git -C tellus checkout {{ tag }}
    git add tellus
