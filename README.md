# Vos Rêves — séminaire d’intégration

Site vitrine statique en français pour le séminaire d’équipe de Vos Rêves à Valence. Aucun serveur ni outil de compilation n’est requis. Les neuf fichiers livrés se trouvent dans `seminaire-vos-reves.zip`.

## Lancer le site

Ouvrez `index.html` dans un navigateur récent (ordinateur ou mobile). Les pages, styles, scripts et contenu par défaut doivent rester dans le même dossier. Le site est également compatible avec un hébergement statique comme GitHub Pages.

## Fichiers du site

- `index.html`, `programme.html`, `galerie.html` : pages publiques.
- `admin.html` et `admin.js` : panneau d’administration.
- `main.js` : navigation, contenus dynamiques, filtres et visionneuse.
- `content.js` : données par défaut ; `style.css` : styles communs.

## Administrer le contenu

1. Ouvrez `admin.html` et entrez le mot de passe initial `admin`.
2. Depuis le panneau, modifiez les textes des pages, les chiffres clés, les ateliers, les photos (URL ou fichier local), l’image de l’affiche et ajoutez des blocs d’information.
3. Cliquez sur **Enregistrer localement** pour garder votre version dans le `localStorage` de ce navigateur.
4. Pour partager ou publier ces changements, utilisez **Exporter JSON**, puis intégrez l’objet exporté dans `content.js` à la place de `window.SITE_DEFAULT_CONTENT` et déployez le site mis à jour. L’import JSON permet de restaurer un export dans le panneau.
5. **Réinitialiser** supprime la sauvegarde locale et recharge les valeurs par défaut du fichier `content.js`.

Un lien discret **Admin** est disponible en bas de chaque page.

## Limites et sécurité

Le `localStorage` est propre à un navigateur et à un appareil : il n’est pas synchronisé avec GitHub Pages ni entre visiteurs. Exporter le JSON et publier le nouveau `content.js` est nécessaire pour rendre les changements visibles à tous. Une image importée est encodée en dataURL ; elle peut fortement augmenter la taille du JSON et du site.

Le mot de passe de l’administration est défini dans `admin.js` (`ADMIN_PASSWORD`). Il peut être modifié avant publication. Ce contrôle s’exécute entièrement côté client : le mot de passe est visible dans les fichiers téléchargés et ne protège pas réellement les données. N’y stockez aucune information confidentielle. L’administration ne remplace pas un service avec authentification serveur.

Les images par défaut de la galerie sont des visuels d’illustration distants ; une connexion internet est nécessaire pour les charger. Les photos et textes ajoutés au panneau sont affichés via des API DOM de texte, sans interprétation HTML.
