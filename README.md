# YouTube Clip Viewer
This is a static maintenance-free website allowing users to navigate one or multiple playlists through your website. It has multiple parameters you can tweek through the YouTube description such as date, people in clip, game etc.

## YouTube Description Parameters
The website gathers parameters from the YouTube description, so you can specify additional information about a clip/video there. Here are the currently available parameters you can specify:

 - `description(your description)` - Displayed below clip Title in quotes ("")
 - `people(person1, person2, person3, ...)`
 - `game(game name)` - Displayed at bottom right corner of clip.
 - `private()` - Makes clip not show up in the clip browser, but can still be accessed via direct link.
 - `recordedBy(person)`
 - `date(2001-01-01)` - Shows up as "Date recorded"

#### An example of what your description could look like:
```
description(This is my clip!) people(Me, My friend, friendly guy) game(csgo)
```
