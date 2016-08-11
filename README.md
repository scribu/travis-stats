travis-stats
============

Charts for [Travis CI](http://travis-ci.org/).

Demo: <http://scribu.github.io/travis-stats/#wp-cli/wp-cli>

Blog post: <http://scribu.net/blog/travis-ci-build-stats.html>

### Private repositories

If you want to show charts for private repositories, you'll have to host the files yourself.

Add a `config.json` file in the root directory, with an [API token](https://docs.travis-ci.com/api/#authentication):

```json
{
	"travis_api_token": "YOUR TOKEN",
	"travis_api_endpoint": "api.travis-ci.org",
	"travis_endpoint": "travis-ci.org"
}
```

**Important:** To avoid getting your API token stolen, configure your server to require basic auth before serving both `index.html` and `config.json`.
