### DEMO available at: https://clips.diglys.lt/
# YouTube Clip Viewer
This is a static maintenance-free website allowing users to navigate one or multiple playlists through your website. It has multiple parameters you can tweak through the YouTube description such as date, people in clip, game etc.

## YouTube Description Parameters
The website gathers parameters from the YouTube description, so you can specify additional information about a clip/video there. Here are the currently available parameters you can specify:

 - `description(your description)` - Displayed below clip Title in quotes ("")
 - `people(person1, person2, person3, ...)`
 - `game(game name)` - Displayed at bottom right corner of clip.
 - `private()` - Makes clip not show up in the clip browser, but can still be accessed via direct link.
 - `recordedBy(person)`
 - `date(2001-01-01)` - Shows up as "Date recorded"

#### An example of what your YouTube video description could look like:
```
description(This is my clip!) people(Me, My friend, friendly guy) game(csgo)
```

## Setup guide
You can host this site for free by using Netlify or Github Pages. Both of these services are completely free to use and provide a 24/7 website. 

You will also need to setup an API gateway, which can also be done completely free using Amazon Lambda. Why do we need to create an API? Since this is a static site, without an additional back-end server (an API in this instance) you would have to store YouTube's API key in the code as plain text, and anyone using inspect element would be able to view it. To avoid this, we do all of the requests to Youtube's API in Amazon Lambda, so that the api key is never shown to the user.

### Generating YouTube API Key
* Go to https://console.cloud.google.com/apis/dashboard
* Click Create Project. Name your project whatever you want, this won't matter.
* Go to https://console.cloud.google.com/apis/library, type "youtube data api v3" and select it, then click Enable.
* Under Credentials, click "CREATE CREDENTIALS" and select "API Key".
* Copy the API key, you will need to use it in other steps.

### API Setup (Amazon Lambda)
* Download [videos.zip](https://github.com/outdrifted/youtube-clips/releases/download/2.0/videos.zip) and [playlistItems.zip](https://github.com/outdrifted/youtube-clips/releases/download/2.0/playlistItems.zip).
* Go to https://aws.amazon.com/lambda/ and create an account (if you don't have one already).
* Go to https://console.aws.amazon.com/lambda/ and click "Create Function". Under Function name, enter "videos" and make sure the Runtime is Node.js. Click Create Function.
* Under Code source, click Upload from > .zip file. Select the videos.zip file.
* In the code, change `const apiKey = ""` to your Youtube API key, that you generated above.
* In the Function overview panel, "Add trigger". Select "API Gateway", then "Create a new API", then "REST API", and under Security select "Open". Go ahead and click Add.
* In the Function overview panel, click on the newly generated "API Gateway", and copy the "API endpoint" value you see on screen. Should look something like this: `https://3w74il8whe.execute-api.eu-north-1.amazonaws.com/default/videos`
* Back in your Github project repo, go to `./js/config.js` and in the `"api_link_videos": ""` variable paste the API link you copied above.
* Repeat the same steps, to create another function with the name "playlistItems", upload playlistItems.zip, and change `"api_link_playlists"` to the created api link.

### Hosting the site (Github Pages)
* Clone the repository: `git clone https://github.com/outdrifted/youtube-clips`
* Edit configuration files in `./js` folder to your liking. See the "Configuration" section.
* Create a new repository in Github: name it whatever you like, leave everything else to default.
* Upload the files to your new Github Repository.
* Click on the Settings tab and select Pages option on the left. Under "Branch" select the main branch and click save.
* Your site should be live at http://your_username.github.io/repository_name

## Configuration
In the `js` folder, there are multiple .js files used to configure the site:
- `config.js` is used to store site configuration variables. If you don't have an `api_link_playlists` or `api_link_videos`, see the "Setup guide" section above.

  Example of full usage:
  ```js
	"api_link_playlists": "https://aql2egv5g8.execute-api.eu-north-1.amazonaws.com/default/playlistItems",
	"api_link_videos": "https://3w74sl8rh3.execute-api.eu-north-1.amazonaws.com/default/videos",
	"site_name": "Clips Site",
	"contact_email": "contact@outdrifted.com"
  ```
- `gameLib.js` is used to store information about games, such as the full name, aliases that can be used in the description for short entries, icon and link to store page.

  Example of full usage:
  ```js
	"CS2": {
		"aliases": ["cs2"],
		"link": "https://store.steampowered.com/app/730/CounterStrike_2/",
		"icon": "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/730/8dbc71957312bbd3baea65848b545be9eae2a355.jpg"
	}
  ```
- `nameLib.js` is used to store information about users, such as their custom profile (appears when clicking on user in clip description), icon, link to profile on steam or other sites, aliases etc.

  Example of full usage:
  ```js
	"yummy": {
		"aliases": ["outdrifted", "yummy", "viluhas"], /*MUST include ALL names (even the key of this object "yummy")*/
		"link": "https://steamcommunity.com/profiles/76561198130515965", /*Link to steam profile*/
		"icon": "https://avatars.cloudflare.steamstatic.com/ded426e17ff06a0a6dd124b5b04691ff1c89442c_full.jpg",
		"profile": {
			"name": "yummy", /*name on profile page*/
			"banner": "https://i.pinimg.com/originals/75/12/37/751237d9a75bfbe1ba9fb681c9ed5e0d.jpg", /*photo on profile page*/
			"url": "outdrifted", /*link to profile (can also go to it by entering an alias)*/
			"bio": "Dev & Admin", /*text below profile picture*/
			"links": [ /*custom links to sites*/
				{
					"name": "Github Project",
					"url": "https://github.com/outdrifted/youtube-clips",
					"icon": "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png"
				}
			]
		}
	},
  ```
- `overrides.js` stores manually edited data about a video. The script gets data from YouTube description, but if there are any overrides in the file, it will prefer to use them instead of the description.

  Example of full usage:
  ```js
	"KNG7r1n6Jk8": {
		title: "RLCS: goal from jstn.",
		game: 'Rocket League',
		people: ['yummy', 'person_without_profile', 'person_with_profile'],
		highlight: true,
	},
	"94WgA_JuQQ4": {
		game: 'CS:GO',
		description: "Esports Clips"
	}
  ```
- `source.js` stores sources of clips, such as singular YouTube or Medal.tv clips, or whole YouTube playlists

  Example of full usage:
  ```js
	playlists: { // Whole playlists of clips
		youtube: [
			"PLeRA6x39Pelk80DqCSA9gyAb85dbVADqc"
		]
	}
  ```