function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const cuisineImages = {
  indian: svgDataUri(`
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="28" fill="url(#a)"/>
      <circle cx="388" cy="92" r="72" fill="white" fill-opacity="0.1"/>
      <ellipse cx="238" cy="190" rx="128" ry="68" fill="#3C2A22"/>
      <ellipse cx="240" cy="180" rx="118" ry="56" fill="#D18D3F"/>
      <path d="M151 151C179 124 221 111 266 119C306 126 338 148 351 177C310 163 267 164 229 173C193 181 168 188 132 177C134 168 141 159 151 151Z" fill="#F7D493"/>
      <circle cx="216" cy="174" r="10" fill="#638E4C"/>
      <circle cx="280" cy="164" r="12" fill="#638E4C"/>
      <circle cx="304" cy="194" r="9" fill="#A6C46A"/>
      <defs><linearGradient id="a" x1="41" y1="24" x2="430" y2="285" gradientUnits="userSpaceOnUse"><stop stop-color="#FAEAD2"/><stop offset="0.55" stop-color="#E8B36A"/><stop offset="1" stop-color="#876545"/></linearGradient></defs>
    </svg>
  `),
  american: svgDataUri(`
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="28" fill="url(#a)"/>
      <circle cx="376" cy="84" r="70" fill="white" fill-opacity="0.12"/>
      <rect x="116" y="154" width="242" height="88" rx="44" fill="#5C3320"/>
      <rect x="130" y="128" width="212" height="60" rx="30" fill="#D79A52"/>
      <rect x="132" y="166" width="214" height="24" rx="12" fill="#93B04E"/>
      <rect x="142" y="192" width="194" height="28" rx="14" fill="#F5E3A3"/>
      <rect x="160" y="112" width="158" height="22" rx="11" fill="#F6D579"/>
      <defs><linearGradient id="a" x1="44" y1="24" x2="430" y2="286" gradientUnits="userSpaceOnUse"><stop stop-color="#F5E8D8"/><stop offset="0.58" stop-color="#D4A87A"/><stop offset="1" stop-color="#8B5B42"/></linearGradient></defs>
    </svg>
  `),
  italian: svgDataUri(`
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="28" fill="url(#a)"/>
      <circle cx="114" cy="78" r="64" fill="white" fill-opacity="0.12"/>
      <ellipse cx="240" cy="190" rx="132" ry="76" fill="#EFE6DB"/>
      <ellipse cx="240" cy="190" rx="118" ry="62" fill="#CA8D55"/>
      <path d="M150 179C187 141 231 128 285 138C313 143 337 158 353 182C319 176 291 178 258 189C221 201 188 211 142 202C143 194 145 186 150 179Z" fill="#F8E8B2"/>
      <circle cx="220" cy="175" r="10" fill="#A4332B"/>
      <circle cx="290" cy="185" r="11" fill="#A4332B"/>
      <circle cx="258" cy="155" r="9" fill="#6E9B5D"/>
      <defs><linearGradient id="a" x1="48" y1="22" x2="436" y2="288" gradientUnits="userSpaceOnUse"><stop stop-color="#FBF1E4"/><stop offset="0.52" stop-color="#D7B08B"/><stop offset="1" stop-color="#8C684E"/></linearGradient></defs>
    </svg>
  `),
  chinese: svgDataUri(`
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="28" fill="url(#a)"/>
      <circle cx="365" cy="90" r="74" fill="white" fill-opacity="0.08"/>
      <ellipse cx="240" cy="194" rx="132" ry="72" fill="#3E231B"/>
      <ellipse cx="240" cy="184" rx="120" ry="58" fill="#C96A40"/>
      <path d="M168 152C208 130 257 128 308 145C326 151 343 160 358 173C319 176 290 181 257 193C219 207 185 213 136 204C142 182 152 162 168 152Z" fill="#F7D68F"/>
      <path d="M346 124L382 78" stroke="#2E1E16" stroke-width="8" stroke-linecap="round"/>
      <path d="M365 133L401 87" stroke="#2E1E16" stroke-width="8" stroke-linecap="round"/>
      <defs><linearGradient id="a" x1="38" y1="16" x2="424" y2="292" gradientUnits="userSpaceOnUse"><stop stop-color="#F8E6D8"/><stop offset="0.54" stop-color="#D68B60"/><stop offset="1" stop-color="#71483E"/></linearGradient></defs>
    </svg>
  `),
  mexican: svgDataUri(`
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="28" fill="url(#a)"/>
      <circle cx="100" cy="82" r="62" fill="white" fill-opacity="0.1"/>
      <ellipse cx="238" cy="190" rx="134" ry="76" fill="#EBDFC9"/>
      <ellipse cx="238" cy="190" rx="120" ry="60" fill="#DFA948"/>
      <path d="M150 174C188 148 226 137 274 140C307 142 335 153 357 172C311 174 280 182 251 194C220 207 189 214 142 207C143 196 146 184 150 174Z" fill="#7EA35E"/>
      <circle cx="216" cy="179" r="11" fill="#B24431"/>
      <circle cx="282" cy="169" r="10" fill="#B24431"/>
      <circle cx="305" cy="193" r="8" fill="#EFE3AC"/>
      <defs><linearGradient id="a" x1="44" y1="20" x2="436" y2="292" gradientUnits="userSpaceOnUse"><stop stop-color="#F5E9D7"/><stop offset="0.57" stop-color="#D4A369"/><stop offset="1" stop-color="#7A5A47"/></linearGradient></defs>
    </svg>
  `),
  cafe: svgDataUri(`
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="28" fill="url(#a)"/>
      <circle cx="374" cy="92" r="74" fill="white" fill-opacity="0.1"/>
      <path d="M164 146H312V222C312 241.882 295.882 258 276 258H200C180.118 258 164 241.882 164 222V146Z" fill="#F1E2CF"/>
      <path d="M312 162H338C354.569 162 368 175.431 368 192C368 208.569 354.569 222 338 222H312" stroke="#F1E2CF" stroke-width="18"/>
      <path d="M196 126C186 112 190 97 205 85" stroke="#EFD4AE" stroke-width="10" stroke-linecap="round"/>
      <path d="M238 118C229 105 231 90 246 78" stroke="#EFD4AE" stroke-width="10" stroke-linecap="round"/>
      <path d="M280 126C270 112 274 97 289 85" stroke="#EFD4AE" stroke-width="10" stroke-linecap="round"/>
      <defs><linearGradient id="a" x1="52" y1="20" x2="425" y2="284" gradientUnits="userSpaceOnUse"><stop stop-color="#F6ECDF"/><stop offset="0.54" stop-color="#D7B18F"/><stop offset="1" stop-color="#7A5C4D"/></linearGradient></defs>
    </svg>
  `),
};
