# Variant sprite render set

The owner's selections from `D:/pokeIdleDex Game.zip` replace the visual skins of
existing species IDs. Levels, IVs, EVs, mutations, source multipliers, inventory,
exclusive rewards and save identifiers are retained.

| ID | Selection | Archive source (normal; append `s` for shiny) |
| --- | --- | --- |
| 90001 | Lucario Senkou | poke/senkou/lucario.png |
| 90002 | Ectoplasma Cristal | poke/crystal/gengar.png |
| 90003 | Dracolosse Chocolat Blanc | poke/easter2015/dragonite-white.png |
| 90004 | Pikachu Fire | poke/fire/pikachum.png |
| 90005 | Steelix Cristallin | poke/ccrystal/steelixf.png |
| 90011 | Absol Patch | poke/patch/absol.png |
| 90012 | Deoxys Ghastly | poke/ghastly/deoxys-normal.png |
| 90013 | Dracaufeu Ghastly | poke/ghastly/charizard.png |
| 90014 | Leviator Ghastly | poke/ghastly/gyaradosm.png |
| 90015 | Reshiram Ghastly | poke/ghastly/reshiram.png |

`reference/` preserves unchanged archive PNGs of the nine selections. Existing
Halloween banner source PNGs remain unchanged in `img/hwf/`, including shinies.
Those come from the archive folders halloween, halloween2011, hw2012, hw2013,
and hw2015.

Renders use the game's existing PokeAPI sprite and official artwork sources:
https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon

`manifest.json` lists each normal/shiny/base/Mega/Gigantamax material, frame count,
timing, and source. Animated WebP preserves alpha and the native animation timing.
Still PNGs retain shaded artwork as a matching-colour fallback.

The four recent Mega forms whose source has no animated sprite (Absol Z, Lucario Z,
Froslass and Chandelure) use a local mesh animation of their shaded artwork. They
are marked `artwork-mesh-animation`, not native 3D models. All other animations use
native sprite motion, recoloured to the selected material palettes.

Archive Golett-happy normal and shiny PNGs are identical. Its shiny render retains
pumpkin orange with a lighter pearlescent finish so the in-game shiny is distinct.

Ordinary species are not restyled unless their saved Halloween flag is active.
