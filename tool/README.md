 Profile data Generator
========================

## Requirements

(1) set environment variables:

```
export GITHUB_HOST=https://api.github.com
export GITHUB_USER=kuronekomichael
export GITHUB_TOKEN=3eb623e7faefeafwfefefeeaa5447679c95b12f5
```

(2) edit `repos.js`

```
module.exports = [
    'OpenKinect/libfreenect2',
    'defunkt/dotjs'
];
```

## Testing

```
mocha
```

or

```
npm test
```

## Generate Profile data

```
npm start
```
