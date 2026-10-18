# tellus.rs

The website of [tellus](https://github.com/tellus-rs/tellus), served at
[tellus.rs](https://tellus.rs) and built with [Zola](https://www.getzola.org).

## Development

You need Zola 0.23 or later and [just](https://just.systems).

```shell
git clone --recurse-submodules git@github.com:tellus-rs/tellus-rs.github.io.git
just serve   # serve locally with live reload
just all     # check links and build into public/
```

## Code samples

The docs include code from compiled tellus examples, so it cannot drift from the API: the
`example` component in `templates/components.html` reads a file from the `tellus` submodule,
optionally only the region between `// ANCHOR: name` and `// ANCHOR_END: name`, with the
indentation of its first line removed from every line:

```jinja
{{<example path="tellus/examples/hello.rs"/>}}
{{<example path="tellus/examples/counter.rs" anchor="receive"/>}}
```

The submodule is pinned to the latest tellus release, so the docs match the crate on crates.io.
After a release, pin it to the new tag and update `version` in `zola.toml`:

```shell
just pin-tellus tellus-v0.4.0
```

The landing page code lives in `snippets/`; see [its README](snippets/README.md) for where each
snippet should eventually come from.

## Articles

The landing page lists the posts tagged `tellus` from the Atom feed of
[heikoseeberger.de](https://heikoseeberger.de), configured under `[extra.articles]` in `zola.toml`.
The feed is read at build time; if it cannot be loaded, the section is left out.

## Deployment

Every push to `main` and a daily scheduled run, which picks up new articles, are checked, built and
deployed to GitHub Pages; pull requests are checked and built only. The custom domain `tellus.rs` is configured in the repository's Pages settings.

The site is built for `https://tellus.rs` unless the repository variable `BASE_URL` overrides it,
which is needed as long as the custom domain is not configured.

## License

The site content and code are licensed under the
[Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0.html). The fonts in
`static/fonts` are licensed under the SIL Open Font License, see `static/fonts/licenses`.
