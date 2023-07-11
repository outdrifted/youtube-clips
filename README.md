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

## Configuration
In the `js` folder, there are multiple .js files.
- `gameLib.js` is used to store information about games, such as the full name, aliases that can be used in the description for short entries, icon and link to store page.

  Example of full usage:
  ```js
  "Deep Rock Galactic": {
  	"aliases": ["drg", "deep rock galactic", 375],
  	"link": "https://store.steampowered.com/app/548430/Deep_Rock_Galactic/",
  	"icon": "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/548430/e033e23c29a192a17c16a7645a2b423ac64ff447.jpg"
  },
  ```
- `nameLib.js` is used to store information about users, such as their custom profile (appears when clicking on user in clip description), icon, link to profile on steam or other sites, aliases etc.

  Example of full usage:
  ```js
  "yummy": {
  	"aliases": ["outdrifted", "yummy", "viluhas", "džūmi"],
  	"link": "https://steamcommunity.com/profiles/76561198130515965",
  	"icon": "https://avatars.cloudflare.steamstatic.com/ded426e17ff06a0a6dd124b5b04691ff1c89442c_full.jpg",
  	"profile": {
  		"name": "yummy",
  		"banner": "https://i.pinimg.com/originals/75/12/37/751237d9a75bfbe1ba9fb681c9ed5e0d.jpg", /*https://wallpaperforu.com/wp-content/uploads/2020/07/dark-wallpaper-20072813214381366x768.jpg*/
  		"url": "outdrifted",
  		"bio": "Dev & Admin",
  		"links": [
	  			{
		  			"name": "Website",
		  			"url": "https://outdrifted.com/",
		  			"icon": "https://i1.sndcdn.com/artworks-000590443583-exzk78-t500x500.jpg"
				}
  		]
  	}
  }
  ```
- `overrides.js` stores manually edited data about a video. The script gets data from YouTube description, but if there are any overrides in the file, it will prefer to use them instead of the description.

  Example of full usage:
  ```js
  "vy9iZZ9FmLo": {
        people: ['jungy', 'GarklOn', 'yummy'],
        game: 'CS:GO',
        dateRecorded: "2022-06-10"
  },
  ```
- `source.js` stores sources of clips, such as singular YouTube or Medal.tv clips, or whole YouTube playlists

  Example of full usage:
  ```js
  const source = {
		playlists: { // Whole playlists of clips
			youtube: [
				"PLeRA6x39PellI87s8Qh6s8ETDlpzsrAI0"
  			],
			medal: [
				13754957,
				3832163
			]
		},
		clips: { // Manual links to clips (if want to upload a singular clip instead of a whole playlist). Specify only ID's of videos.
			youtube: [
				"vy9iZZ9FmLo", /* prapal chelovek */
				"eV3_TMdSMK8", /* kas ce pareina */
				"QUPopBp2iYk"
			],
			medal: [
				"2f0VT4vZFXhHx"
			]
		}
	}
  ```
  

## How to install
You can host this site for free by using Netlify or Github Pages. Both of these services are completely free to use and provide a 24/7 website.
