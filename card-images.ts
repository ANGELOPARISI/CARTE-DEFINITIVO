// card-images.ts
// Immagini dei 22 Arcani Maggiori e 56 Arcani Minori caricate da GitHub (JPG)

const BASE_URL =
  "https://raw.githubusercontent.com/ANGELOPARISI/tarocchi-assets/main/images/tarocchi/";

export const MAJOR_ARCANA_IMAGES: string[] = [
  `${BASE_URL}00-matto.jpg`,
  `${BASE_URL}01-bagatto.jpg`,
  `${BASE_URL}02-papessa.jpg`,
  `${BASE_URL}03-imperatrice.jpg`,
  `${BASE_URL}04-imperatore.jpg`,
  `${BASE_URL}05-papa.jpg`,
  `${BASE_URL}06-innamorati.jpg`,
  `${BASE_URL}07-carro.jpg`,
  `${BASE_URL}08-giustizia.jpg`,
  `${BASE_URL}09-eremita.jpg`,
  `${BASE_URL}10-ruota.jpg`,
  `${BASE_URL}11-forza.jpg`,
  `${BASE_URL}12-appeso.jpg`,
  `${BASE_URL}13-arcano13.jpg`,
  `${BASE_URL}14-temperanza.jpg`,
  `${BASE_URL}15-diavolo.jpg`,
  `${BASE_URL}16-casa-dio.jpg`,
  `${BASE_URL}17-stella.jpg`,
  `${BASE_URL}18-luna.jpg`,
  `${BASE_URL}19-sole.jpg`,
  `${BASE_URL}20-giudizio.jpg`,
  `${BASE_URL}21-mondo.jpg`,
];

// Base URL per gli Arcani Minori
const BASE_URL_MINOR =
  "https://raw.githubusercontent.com/ANGELOPARISI/tarocchi-assets/main/images/minori/";

// helper per creare i path
const suit = (
  name: "bastoni" | "coppe" | "spade" | "denari",
  file: string
) => `${BASE_URL_MINOR}${name}/${file}`;

// 56 Arcani Minori (ordine tradizionale per semi)
export const MINOR_ARCANA_IMAGES: string[] = [
  // BASTONI
  suit("bastoni", "bastoni-01.jpg"),
  suit("bastoni", "bastoni-02.jpg"),
  suit("bastoni", "bastoni-03.jpg"),
  suit("bastoni", "bastoni-04.jpg"),
  suit("bastoni", "bastoni-05.jpg"),
  suit("bastoni", "bastoni-06.jpg"),
  suit("bastoni", "bastoni-07.jpg"),
  suit("bastoni", "bastoni-08.jpg"),
  suit("bastoni", "bastoni-09.jpg"),
  suit("bastoni", "bastoni-10.jpg"),
  suit("bastoni", "bastoni-fante.jpg"),
  suit("bastoni", "bastoni-cavaliere.jpg"),
  suit("bastoni", "bastoni-regina.jpg"),
  suit("bastoni", "bastoni-re.jpg"),

  // COPPE
  suit("coppe", "coppe-01.jpg"),
  suit("coppe", "coppe-02.jpg"),
  suit("coppe", "coppe-03.jpg"),
  suit("coppe", "coppe-04.jpg"),
  suit("coppe", "coppe-05.jpg"),
  suit("coppe", "coppe-06.jpg"),
  suit("coppe", "coppe-07.jpg"),
  suit("coppe", "coppe-08.jpg"),
  suit("coppe", "coppe-09.jpg"),
  suit("coppe", "coppe-10.jpg"),
  suit("coppe", "coppe-fante.jpg"),
  suit("coppe", "coppe-cavaliere.jpg"),
  suit("coppe", "coppe-regina.jpg"),
  suit("coppe", "coppe-re.jpg"),

  // SPADE
  suit("spade", "spade-01.jpg"),
  suit("spade", "spade-02.jpg"),
  suit("spade", "spade-03.jpg"),
  suit("spade", "spade-04.jpg"),
  suit("spade", "spade-05.jpg"),
  suit("spade", "spade-06.jpg"),
  suit("spade", "spade-07.jpg"),
  suit("spade", "spade-08.jpg"),
  suit("spade", "spade-09.jpg"),
  suit("spade", "spade-10.jpg"),
  suit("spade", "spade-fante.jpg"),
  suit("spade", "spade-cavaliere.jpg"),
  suit("spade", "spade-regina.jpg"),
  suit("spade", "spade-re.jpg"),

  // DENARI
  suit("denari", "denari-01.jpg"),
  suit("denari", "denari-02.jpg"),
  suit("denari", "denari-03.jpg"),
  suit("denari", "denari-04.jpg"),
  suit("denari", "denari-05.jpg"),
  suit("denari", "denari-06.jpg"),
  suit("denari", "denari-07.jpg"),
  suit("denari", "denari-08.jpg"),
  suit("denari", "denari-09.jpg"),
  suit("denari", "denari-10.jpg"),
  suit("denari", "denari-fante.jpg"),
  suit("denari", "denari-cavaliere.jpg"),
  suit("denari", "denari-regina.jpg"),
  suit("denari", "denari-re.jpg"),
];

export const MAJOR_ARCANA_NAMES: string[] = [
  "Il Matto",
  "Il Bagatto",
  "La Papessa",
  "L'Imperatrice",
  "L'Imperatore",
  "Il Papa",
  "Gli Innamorati",
  "Il Carro",
  "La Giustizia",
  "L'Eremita",
  "La Ruota",
  "La Forza",
  "L'Appeso",
  "Arcano XIII",
  "La Temperanza",
  "Il Diavolo",
  "La Casa Dio",
  "La Stella",
  "La Luna",
  "Il Sole",
  "Il Giudizio",
  "Il Mondo",
];
