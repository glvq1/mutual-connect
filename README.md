# Mutual Connect — Passage en application installable (PWA)

Le code métier reste 100 % dans Apps Script. Ce dossier n'est qu'une « coquille » qui affiche l'URL `/exec`.
Les utilisateurs réfractaires gardent un simple lien navigateur.

---

## Étape 0 — Prérequis côté Apps Script (déjà OK en v1.11.0)

- `doGet` contient `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` ✅
- `appsscript.json` : aucune modification nécessaire ✅

## Étape 1 — Patch iPhone/iPad (optionnel, si utilisateurs iOS)

Dans `app.html`, remplacer la fonction `lancerExportHistorique` par :

```js
function lancerExportHistorique() {
    const debut = document.getElementById('histDateDebut').value;
    const fin = document.getElementById('histDateFin').value;
    if (!debut || !fin) { showError('Sélectionnez les deux dates.'); return; }
    showLoading();
    google.script.run
        .withSuccessHandler(result => {
            hideLoading();
            if (!result.success) { showError(result.error || 'Erreur export.'); return; }
            const bin = atob(result.base64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            fermerExportHistorique();
        })
        .withFailureHandler(err => { hideLoading(); showError('Erreur : ' + err.message); })
        .exportHistoriqueGerbageExcel(debut, fin);
}
```

Puis : Déployer → Gérer les déploiements → ✏️ → Version : **Nouvelle version** → Déployer.

## Étape 2 — Préparer la coquille

1. Décompresser `mutual-pwa.zip`.
2. Ouvrir `index.html` avec le Bloc-notes.
3. Remplacer `https://script.google.com/macros/s/VOTRE_ID_DE_DEPLOIEMENT/exec` par l'URL `/exec` de production (avec `https://`). Enregistrer.
4. (Optionnel) Remplacer `icon-192.png` et `icon-512.png` par le logo Mutual (mêmes noms, carrés 192×192 et 512×512).

## Étape 3 — Mettre en ligne sur GitHub Pages

1. Se connecter sur github.com (ou créer un compte).
2. **+** (en haut à droite) → *New repository* → nom `mutual-connect` → **Public** → *Create repository*.
   (Public = seule la coquille est visible, aucune donnée.)
3. Cliquer *uploading an existing file* → glisser les 6 fichiers (pas le dossier) → *Commit changes*.
4. *Settings* → *Pages* → Source : *Deploy from a branch* → Branch : `main` / `/ (root)` → *Save*.
5. Attendre 1-2 min, recharger : l'URL apparaît → `https://<compte>.github.io/mutual-connect/`
6. Tester : l'appli s'affiche, un formulaire avec photo s'envoie, le mail arrive, l'export Excel fonctionne.
   Page blanche → vérifier l'URL `/exec` dans `index.html`.

## Étape 4 — Liens des emails vers l'appli (optionnel)

Dans `Code.gs`, remplacer `setExecUrl` par :

```js
function setExecUrl() {
  const url = 'https://<compte>.github.io/mutual-connect/';
  props.setProperty(STORAGE_KEYS.EXEC_URL, url);
  return 'URL enregistrée : ' + url;
}
```

Sélectionner `setExecUrl` → ▶️ Exécuter (une fois). Pas de redéploiement nécessaire.

## Étape 5 — Diffusion aux utilisateurs

Partager l'URL GitHub (QR code affiché à l'entrepôt, mail, SMS).

| Appareil | Installation |
|---|---|
| Android (Chrome) | Bandeau « Installer l'application » ou ⋮ → Installer |
| iPhone / iPad | Ouvrir dans Safari → Partager → *Sur l'écran d'accueil* |
| PC / Mac (Chrome, Edge) | Icône ⊕ dans la barre d'adresse → Installer |
| Mac (Safari 17+) | Fichier → Ajouter au Dock |

Réfractaires : même lien dans le navigateur, rien à installer. L'URL `/exec` reste aussi utilisable.
Tablettes de l'entrepôt : les installer soi-même une fois.

---

## Au quotidien

- **Mises à jour** : rien ne change. Coder dans Apps Script → Gérer les déploiements → ✏️ → **Nouvelle version**. Visible partout au prochain lancement.
- ⚠️ Ne jamais faire *Nouveau déploiement* (nouvelle URL → l'appli afficherait l'ancienne). Si l'URL change malgré tout : la mettre à jour dans `index.html` sur GitHub (✏️ sur le fichier → Commit).
- **GitHub** ne se retouche que pour l'icône, le nom ou l'URL. Après modif de la coquille, incrémenter `CACHE` dans `sw.js` (`v1` → `v2`).

## Limites

- Internet obligatoire (pas de mode hors ligne).
- Appareils très anciens (Android ≤ 7, iOS ≤ 15) non garantis.
- iPhone/iPad : l'export Excel ouvre un aperçu → Partager → Enregistrer dans Fichiers.
- Firefox ordinateur : installation non garantie, navigateur OK.
