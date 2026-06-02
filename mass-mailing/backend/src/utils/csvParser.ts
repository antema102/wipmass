import { parse } from 'csv-parse/sync';

export interface CsvContact {
  email: string;
  firstName: string;
  lastName: string;
  tags: string[];
}

/**
 * Parse le contenu d'un fichier CSV et retourne une liste de contacts.
 * Headers acceptés (insensible à la casse) :
 *   email / Email / EMAIL
 *   firstName / firstname / first_name / Prénom
 *   lastName  / lastname  / last_name  / Nom
 *   tags / Tags  (valeurs séparées par des virgules)
 */
export const parseCsvContacts = (csvContent: string): CsvContact[] => {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,           // Gère le BOM UTF-8
    relax_quotes: true,
  }) as Record<string, string>[];

  return records
    .map((r) => {
      const email = (
        r['email'] ?? r['Email'] ?? r['EMAIL'] ?? r['e-mail'] ?? r['E-mail'] ?? ''
      ).toLowerCase().trim();

      const firstName = (
        r['firstName'] ?? r['firstname'] ?? r['first_name'] ?? r['Prénom'] ?? r['prenom'] ?? ''
      ).trim();

      const lastName = (
        r['lastName'] ?? r['lastname'] ?? r['last_name'] ?? r['Nom'] ?? r['nom'] ?? ''
      ).trim();

      const rawTags = (r['tags'] ?? r['Tags'] ?? r['TAGS'] ?? '').trim();
      const tags = rawTags
        ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      return { email, firstName, lastName, tags };
    })
    .filter((c) => c.email.length > 0);
};
