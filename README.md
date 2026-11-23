# ALMA Tattoo Academy: אתר תצוגה מקדימה

אתר סטטי ללא תלויות. התוכן נמצא ב-`site/content.js`.

## הפעלה
```
node server.js
```
ואז פתיחת http://localhost:4173

## מבנה
- `site/content.js`: מקור התוכן (פרקים, סעיפים, סטטוסים)
- `site/app.js`: ניתוב, עמודים וסימון קריאה (localStorage)
- `site/styles.css`: עיצוב ותנועה, כולל `prefers-reduced-motion`
- `site/assets/img/hero-linework.svg`: **תמונה זמנית, להחלפה בצילום ALMA**

## GitHub Pages
הגרסה הציבורית נבנית לתיקיית `docs/`:
```
node build-pages.js
```
ה-Pages מוגדר לשרת את `main` מתיקיית `/docs`, והאתר נמצא תחת `/alma-tattoo-academy/`.
