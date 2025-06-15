function generateName() {
  /* === grammar tables === */
  const tables = {
    vowel: ['a','e','i','o','u'],

    starter:      ['b','c','f','g','p'],
    starterUnmod: ['ch','h','j','m','n','r','s','t','th','v','w','y','z','dr'],
    starterMod:   ['r','l'],

    endMod:   ['d','f','g','k','t'],
    endUnmod: ['n','nce','ncy','nge','vila','vida'],
    endModder:['n','l'],

    ender: [
      'ia','[vowel]nia','ea','[vowel]ly','[vowel]ny','[vowel]cky',
      '[vowel]nty','[vowel]ca','[vowel]na','[vowel]r','[vowel]ch',
      '[vowel]rra','[vowel]ra','[vowel]ry',
      '[v = vowel.selectOne]d[v]','[v = vowel.selectOne]n[v]',
      '[v = vowel.selectOne]t[v]','[v = vowel.selectOne]d[v]'
    ]
  };

  /* === cmb patterns with weights === */
  const cmbPatterns = [
    ['[starterUnmod][vowel][endModder][endMod][ender]', 4],
    ['[starter][starterMod][vowel][endUnmod]',          1],
    ['[vowel][endModder][endMod][ender]',               2]
  ];

  /* === utilities === */
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

  function weightedChoice(list) {
    const total = list.reduce((s,[,w])=>s+w,0);
    let pick = Math.random()*total;
    for (const [item,w] of list) if((pick-=w)<0) return item;
  }

  /* === recursive expander ======================================= */
  function expand(str, vars = {}) {
    const re = /\[([^\]]+)]/g;

    return str.replace(re, (_, token) => {
      token = token.trim();

      /* variable assignment, e.g. v=vowel.selectOne */
      const m = token.match(/^(\w+)\s*=\s*(\w+)\.selectOne$/);
      if (m) {
        const [, varName, tableKey] = m;
        vars[varName] = rnd(tables[tableKey]);
        return '';                           // nothing visible here
      }

      /* variable reference */
      if (vars.hasOwnProperty(token)) {
        return vars[token];
      }

      /* table reference */
      if (tables[token]) {
        return expand(rnd(tables[token]), vars);  // recurse for nested []
      }

      /* fallback: leave untouched */
      return token;
    });
  }

  /* === generate one name ======================================== */
  const pattern = weightedChoice(cmbPatterns);
  const expanded = expand(pattern).replace(/\s+/g, '');

  return expanded[0].toUpperCase() + expanded.slice(1,expanded.length);
}