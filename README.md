# Pokémon Platinum Kaizo Damage Calculator

This is the official damage calculator for Pokémon Platinum Kaizo, it includes the sets of all trainers in the game, in addition to a Dex with information about the Pokémon, moves, locations, etc., and automatic encounter tracking.

The calculator can be found at https://pkcalc.anastarawneh.com.

For any questions or issues with the calc, or if you want to play the game, join the SinisterHQ Discord server: https://discord.gg/GgtjZVS

## Developer?

I won't stop you from forking this repository for your own projects, but keep in mind that I am working on a template version of this calculator that is less hard-coded for PK.

## Smogon Calculator Installation Instructions

The [UI layer][2] is currently is written in vanilla JavaScript and HTML. To view the UI locally you
first must install dependencies by running `npm install` at the top level and without `calc/`. This
should create a `node_modules/` folder under both the root directory and under `calc/`:

```sh
$ npm install
$ cd calc && npm install
```

Next, run `node build` from the root directory of your clone of this repository. This should
run `npm run compile` in the `calc/` subdirectory to compile the `@smogon/calc` package from
TypeScript to JavaScript that can be run in the browser, and then compile the 'templated' HTML
and copy everything into the top-level `dist/` folder. To then view the UI, open `dist/index.html` -
simply double-clicking on the file from your operating system's file manager UI should open it in
your default browser.

```sh
$ node build
$ open dist/index.html # open works on macOS, simply double-clicking the file on Windows/macOS works
```

**If you make changes to anything in `calc/`, you must run `node build` from the top level to
compile the files and copy them into `dist/` again. If you make changes to the HTML or JavaScript in
`src/`you must run `node build view` before the changes will become visible in your browser**
(`node build` also works, but it is slower, as it will compile `calc/` as well, which is
unnecessary if you did not make any changes to that directory).

## Credits

This project is based on the Smogon damage calculator, originally created by Honko and primarily maintained by Austin and jetou.

- Gens 1-6 were originally implemented by Honko.
- The Omega Ruby / Alpha Sapphire update was done by gamut-was-taken and Austin.
- The Gen 7 update was done by Austin.
- The Gen 8 update was done by Austin and Kris.
- The Gen 9 update was done by Austin and Kris.
- Some CSS styling was contributed by Zarel to match the Pokémon Showdown! theme.

Many other contributors have added features or contributed bug fixes, please see the
[full list of contributors](https://github.com/smogon/damage-calc/graphs/contributors).

## License

This package is distributed under the terms of the [MIT License][3].

  [0]: https://github.com/smogon/damage-calc
  [1]: https://github.com/smogon/damage-calc/tree/master/calc
  [2]: https://github.com/smogon/damage-calc/tree/master/src
  [3]: https://github.com/smogon/damage-calc/blob/master/LICENSE
  [4]: https://github.com/smogon/damage-calc/blob/master/TASKS.md
  [5]: https://unpkg.com/
  [6]: https://webpack.js.org/
  [7]: https://rollupjs.org/
  [8]: https://parceljs.org/
  [9]: https://github.com/pkmn/ps/blob/master/data
