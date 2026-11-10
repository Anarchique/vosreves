# Vos Rêves — escapades et séminaire à Valence

Site vitrine multi-pages en français pour Vos Rêves, maison de voyages haut de gamme spécialisée dans les grands espaces d’Amérique du Nord et les lagons de Polynésie. Le site présente également le séminaire de cohésion organisé à Valence. Site statique, sans serveur ni compilation.

## Lancer le site

Gardez tous les fichiers ci-dessous dans un même dossier et ouvrez `index.html` dans un navigateur récent, ou publiez-les sur un hébergement statique. Une connexion à Internet est nécessaire pour les polices Google Fonts et les photographies distantes Unsplash.

## Pages et fichiers

- `index.html` : accueil immersif, chiffres et bilan du séminaire, et bac à sable interactif.
- `programme.html` : ateliers et matrice de compétences.
- `galerie.html` : filtres, galerie, affiche souvenir et visionneuse accessible.
- `equipe.html` : composition illustrative du collectif et agences.
- `admin.html` : panneau d’administration local.
- `style.css` : styles communs, responsive et identité touristique.
- `content.js` : données de contenu livrées par défaut.
- `main.js` : contenus dynamiques, navigation mobile, galerie, filtres et visionneuse.
- `admin.js` : gestion locale et édition du contenu.
- `sand.js` : sillons tactiles/souris, animation légère des grains et bouton de lissage.
- `seminaire-vos-reves.zip` : archive complète des fichiers du site.

## Sable interactif

Sur l’accueil, glissez la souris ou le doigt dans la bande de sable sous le hero pour tracer des sillons. **Lisser le sable** efface les traces. L’animation légère des grains est suspendue lorsqu’elle n’est pas visible, et la préférence système `prefers-reduced-motion` est respectée. Le canevas adapte sa résolution à l’écran, avec un plafond pour limiter son coût graphique.

## Administrer le contenu

1. Ouvrez `admin.html` et entrez le mot de passe initial `admin`.
2. Modifiez les textes, chiffres clés, ateliers, photos ou blocs d’information.
3. Cliquez **Enregistrer localement** pour conserver les changements dans le `localStorage` de ce navigateur.
4. Pour publier les modifications à tous les visiteurs, exportez le JSON et intégrez-le au contenu par défaut de `content.js`. L’import JSON restaure une sauvegarde dans le panneau.
5. **Réinitialiser** supprime la sauvegarde locale et recharge les valeurs de `content.js`.

Le lien **Admin** est en pied des pages publiques. Les photos de galerie par défaut sont des visuels d’illustration : elles ne constituent pas un reportage du séminaire.

## Limites et sécurité

Le `localStorage` n’est partagé ni entre appareils ni entre visiteurs. Une image importée est convertie en dataURL et peut faire croître fortement le fichier JSON. Le mot de passe défini dans `admin.js` (`ADMIN_PASSWORD`) est contrôlé côté client : il ne protège pas de véritables données confidentielles et ne remplace pas une authentification serveur.
