const startTimer = performance.now();

$(document).ready(function() {
	//#region Getting URL Data
	const urlData = (function() {
		var data = location.href.substring(location.href.indexOf('?'))
		if (data == "?" || data.includes("https://") || data.includes("http://")) return null;
		return decodeURI(data)
	})();
	const urlGame = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?g=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
	})();
	const urlUploader = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?u=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
	})();
	const urlVideo = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?v=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
	})();
	const urlSorting = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?s=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
	})();
	const urlProfile = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?p=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
	})();
	/*
	const urlPeople = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?p=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data).split('&').map(s => s.trim()).sort()
	})();
	const urlRecordedBy = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?r=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data).split('&').map(s => s.trim()).sort()
	})();
	const urlDate = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?d=').pop().split('?')[0];
		if (data == "") return null;
		var data = data.split('&');
		data[0] += `T00:00:01Z`
		data[1] += `T23:59:59Z`
		return data;
	})();
	*/
	//#endregion
	
	(async function() {
		var videos = [];
		var videosNoPrivate = [];
		
		var sortingProperty = "";
		var sortingReverse = "";
		switch (urlSorting) {
			case '1':
				sortingProperty = "dateRecordedAgo";
				sortingReverse = "-";
				break;
			case '2':
				sortingProperty = "dateAddedAgo";
				sortingReverse = "";
				break;
			case '3':
				sortingProperty = "dateAddedAgo";
				sortingReverse = "-";
				break;
			default:
				sortingProperty = "dateRecordedAgo";
				sortingReverse = "";
				break;
		}
		
		//#region Get Youtube videos via YT API
		for (const playlistID of source.playlists.youtube) {
			var data = await (async function() {
				var ret = [];
				var ret_temp = [];

				var options = {
					part: 'snippet',
					key: 'AIzaSyCb62u0hNUTyUtcdOi-VbZtSNtisI7uCB0',
					maxResults: 50,
					playlistId: playlistID,
					url: 'https://www.googleapis.com/youtube/v3/playlistItems'
				};

				await getVids(null)
				async function getVids(token) {
					if (token != null) { options.pageToken = token; }
					await $.getJSON(options.url, options, function (data) { return ret_temp.push(data); }).then(async (data) => {
						if ('nextPageToken' in data) {await getVids(data.nextPageToken)} else {ret = ret_temp };
					});
				}

				return ret;
			})()
			
			for (const d of data) {
				videos.push(formatVideos(removeUnavailable(d)));
			}
		}

		for (const videoID of source.clips.youtube) {
			await (async function() {
				var ret = undefined;

				var options = {
					part: 'snippet',
					key: 'AIzaSyCb62u0hNUTyUtcdOi-VbZtSNtisI7uCB0',
					id: videoID,
					url: 'https://www.googleapis.com/youtube/v3/videos'
				};
				
				await (async function getVids() {
					await $.getJSON(options.url, options, function (data) {return ret = data;})})()

				return ret;
			})().then(r => videos.push(formatVideos(removeUnavailable(r))))
			
			//console.log(data);
			
		}
		//#endregion

		//#region Get Medal.tv videos via Medal API https://docs.medal.tv/api#v1latest---latest-clips-from-a-user-or-game
		for (const playlistID of source.playlists.medal) {
			var data = undefined;

			await $.ajax({
				beforeSend: function(request) {
					request.setRequestHeader("Authorization", 'pub_9SLaE4VYcyGj3kKZhkIfe5cSNT9r5614');
				},
				dataType: "json",
				url: `https://developers.medal.tv/v1/latest?userId=${playlistID}&limit=1000`,
				success: function(returned) {
					data = returned;
				}
			});
			
			videos.push(formatVideosMedal(data));
		}
		//#endregion

		videosNoPrivate = videos;

		var videos = [].concat.apply([], videos);
		var videosNoPrivate = [].concat.apply([], videosNoPrivate);

		main(videos.sort(sortByProperty(`${sortingReverse}${sortingProperty}`)), removePrivates(videosNoPrivate).sort(sortByProperty(`${sortingReverse}${sortingProperty}`)));
	})()

	var selected_vid = undefined;

	function main(videos, videosNoPrivate) {
		$(`.loading`).remove();

		if (urlProfile) {
			console.log(urlProfile)
			// Fetch profile info
			var name = undefined;
			var info = undefined;
			for ([key, val] of Object.entries(nameLib)) {
				try {
					if (val.aliases.includes(urlProfile.toLowerCase()) || val.profile.url == urlProfile.toLowerCase()) {
						info = val;
						name = key;
					}
				} catch {}
			}

			// If profile not found, show error
			if (info) {
				// If banner exists, display it
				if (info.profile && info.profile.banner && info.profile.banner != "") {
					$('.main').prepend(`
					<div class="profileInfo">
						<img class="banner" src="${info.profile.banner}">
						<img class="profilePic profilePicBanner" src="${info.icon}">
						<h1 class="profileName">${name}</h1>
					</div>
				`);
				} else {
					$('.main').prepend(`
					<div class="profileInfo">
						<img class="profilePic" src="${info.icon}">
						<h1 class="profileName">${name}</h1>
					</div>
				`);
				}

				// If bio exists, display it
				if (info.profile && info.profile.bio && info.profile.bio != "") {
					$('.profileInfo').append(`
						<div class="profileBio">${info.profile.bio}</div>
					`);
					
					if (info.profile.links) {
						info.profile.links.forEach(link => {
							$('.profileLinks').append(`<a title="${link.name}" href="${link.url}"><img src="${link.icon}"></img></a>`);
						});
					}
					
				}

				// If links exist, display them
				$('.profileInfo').append(`
						<div class="profileLinks">
						<a title="Steam" href="${info.link}"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/640px-Steam_icon_logo.svg.png"></img></a>
						</div>
					`);
				if (info.profile && info.profile.links) {					
					info.profile.links.forEach(link => {
						$('.profileLinks').append(`<a title="${link.name}" href="${link.url}"><img src="${link.icon}"></img></a>`);
					});
				}

				//#region Clips
				console.log(videosNoPrivate);

				videosNoPrivate.forEach(video => {
					if (!video.people.includes(name)) return;
					if (urlGame && video.game != urlGame) return;
					if (urlUploader && /*video.uploadedBy*/ video.recordedBy != urlUploader) return;
	
					var vid_desc = "";
					var vid_game = ``;
					var vid_new = ``;
					var vid_highlight = ``;
					var vid_uploadedBy = ``;
		
					if (video.description) vid_desc = `<div class="video-description">"${video.description}"</div>`
					if (video.dateAddedAgo < 432000000) var vid_new = `<div class="new-clip">NEW!</div>`;
					if (video.highlight) vid_highlight = `<div class="clip_highlighted_popout">🔥</div>`;
					
					var searchby = video.uploadedBy;
					if (video.recordedBy) searchby = video.recordedBy;
	
					if (nameLib[searchby]) {
						vid_uploadedBy += `<div class="video_uploadedBy"><img draggable="false" src="${nameLib[searchby].icon}"></img>${searchby}</div>`;
					} else vid_uploadedBy += `<div class="video_uploadedBy">${searchby}</div>`;
	
					//if (video.game) vid_game = `<div class="video_people_detailed video-game"><img draggable="false" src="${gameLib[video.game].icon}"></img>${video.game}</div>`
		
					if (video.game && (video.game != "Other")) {
						vid_game += `<div class="video_game">${gameLib[video.game] && gameLib[video.game].icon ? `<img draggable="false" src="${gameLib[video.game].icon}"></img>` : ""}${video.game}</div>`;
					} else vid_game += `<div class="video-game">‎</div>`;
	
					/*
					<div class="video-date">${formatDate(video.dateRecorded || video.dateAdded)}</div>
					*/
	
					$('.video-list').append(`
						<div class="video ${video.highlight ? "clip_highlighted" : ""}" id="clip-${video.id}">
							<div>
							<div class="popouts">
							${vid_new}
							${vid_highlight}
							</div>
							<img class="video-thumbnail" draggable="false" src="${video.thumbnail.medium.url}"></img>
							</div>
							<div class="description">
								<div>
									<div class="video-title">${video.title}</div>
									${vid_desc}
								</div>
								<div class="video-footer">
									${vid_uploadedBy}
									${vid_game}
								</div>
							</div>
							<a href="${`./?v=${video.id}`}" style="display: block;"><span class="link-spanner"></span></a>
						</div>
					`);
				})
				//#endregion
			} else {
				$('.main').append(`
					<div class="error" style="border-top-left-radius: 0px; border-top-right-radius: 0px;margin:0px">Profile not found.</div>
				`);
			}

			$('.main').prepend(`
				<div class="back">clips.outdrifted.com<a href="./" style="display: block;"><span class="link-spanner"></span></a></div>
			`);

			if ($(`.video`).length > 0) {
				$(`<h1 class="profileClipsText">Clips ${name} is in:</h1>`).insertAfter(`.profileInfo`)
			}
		} else if (!urlVideo) {
			// No video specified
			const games = getGames(videos);
			if (urlGame) {
				$('#select-game').append(`<option value="">All games</option>`);
				games.forEach(game => {
					if (game == urlGame) {
						$('#select-game').append(`<option value="${game}" selected="selected">${game}</option>`);
					} else {
						$('#select-game').append(`<option value="${game}">${game}</option>`);
					}
				})
			} else {
				$('#select-game').append(`<option value="" selected="selected">All games</option>`);
				games.forEach(game => {
					$('#select-game').append(`<option value="${game}">${game}</option>`);
				})
			}

			const uploaders = getUploaders(videos);
			if (urlUploader) {
				$('#select-uploader').append(`<option value="">By Everyone</option>`);
				uploaders.forEach(uploader => {
					if (uploader == urlUploader) {
						$('#select-uploader').append(`<option value="${uploader}" selected="selected">By ${uploader}</option>`);
					} else {
						$('#select-uploader').append(`<option value="${uploader}">By ${uploader}</option>`);
					}
				})
			} else {
				$('#select-uploader').append(`<option value="" selected="selected">By Everyone</option>`);
				uploaders.forEach(uploader => {
					$('#select-uploader').append(`<option value="${uploader}">By ${uploader}</option>`);
				})
			}

			if (urlSorting && (urlSorting == 1 || urlSorting == 2 || urlSorting == 3)) {
				$('#select-sort').append(`<option value="">Sort: Recorded date ⬇️</option>`);
				
				if (urlSorting == 1) {
					$('#select-sort').append(`<option value="1" selected="selected">Sort: Recorded date ⬆️</option>`);
				} else {
					$('#select-sort').append(`<option value="1">Sort: Uploaded date ⬆️</option>`);
				}

				if (urlSorting == 2) {
					$('#select-sort').append(`<option value="2" selected="selected">Sort: Uploaded date ⬇️</option>`);
				} else {
					$('#select-sort').append(`<option value="2">Sort: Uploaded date ⬇️</option>`);
				}

				if (urlSorting == 3) {
					$('#select-sort').append(`<option value="3" selected="selected">Sort: Uploaded date ⬆️</option>`);
				} else {
					$('#select-sort').append(`<option value="3">Sort: Uploaded date ⬆️</option>`);
				}
			} else {
				$('#select-sort').append(`<option value="" selected="selected">Sort: Recorded date ⬇️</option>`);
				$('#select-sort').append(`<option value="1">Sort: Recorded date ⬆️</option>`);
				$('#select-sort').append(`<option value="2">Sort: Uploaded date ⬇️</option>`);
				$('#select-sort').append(`<option value="3">Sort: Uploaded date ⬆️</option>`);
			}

			$('.options').css('display', 'flex');

			videosNoPrivate.forEach(video => {
				if (urlGame && video.game != urlGame) return;
				if (urlUploader && /*video.uploadedBy*/ video.recordedBy != urlUploader) return;

				var vid_desc = "";
				var vid_game = ``;
				var vid_new = ``;
				var vid_highlight = ``;
				var vid_uploadedBy = ``;
	
				if (video.description) vid_desc = `<div class="video-description">"${video.description}"</div>`
				if (video.dateAddedAgo < 432000000) var vid_new = `<div class="new-clip">NEW!</div>`;
				if (video.highlight) vid_highlight = `<div class="clip_highlighted_popout">🔥</div>`;
				
				var searchby = video.uploadedBy;
				if (video.recordedBy) searchby = video.recordedBy;

				if (nameLib[searchby]) {
					vid_uploadedBy += `<div class="video_uploadedBy"><img draggable="false" src="${nameLib[searchby].icon}"></img>${searchby}</div>`;
				} else vid_uploadedBy += `<div class="video_uploadedBy">${searchby}</div>`;

				//if (video.game) vid_game = `<div class="video_people_detailed video-game"><img draggable="false" src="${gameLib[video.game].icon}"></img>${video.game}</div>`
	
				if (video.game && (video.game != "Other")) {
					vid_game += `<div class="video_game">${gameLib[video.game] && gameLib[video.game].icon ? `<img draggable="false" src="${gameLib[video.game].icon}"></img>` : ""}${video.game}</div>`;
				} else vid_game += `<div class="video-game">‎</div>`;

				/*
				<div class="video-date">${formatDate(video.dateRecorded || video.dateAdded)}</div>
				*/

				$('.video-list').append(`
					<div class="video ${video.highlight ? "clip_highlighted" : ""}" id="clip-${video.id}">
						<div>
						<div class="popouts">
						${vid_new}
						${vid_highlight}
						</div>
						<img class="video-thumbnail" draggable="false" src="${video.thumbnail.medium.url}"></img>
						</div>
						<div class="description">
							<div>
								<div class="video-title">${video.title}</div>
								${vid_desc}
							</div>
							<div class="video-footer">
								${vid_uploadedBy}
								${vid_game}
							</div>
						</div>
						<a href="${window.location.href + `?v=${video.id}`}" style="display: block;"><span class="link-spanner"></span></a>
					</div>
				`);
			})

			if ($('.video-list').children().length == 0) {
				$('.main').append(`<div class="error">No clips found.</div>`)
			}

			$('title').html($(`#select-game`).find(':selected').val() ? `${$(`#select-game`).find(':selected').val()} - Clips` : "Clips");
		} else if (urlVideo) {
			// Video specified
			var video = videos.find(v => v.id == urlVideo);
			selected_vid = video;
			
			if (!video) {
				$('.main').append(`
				<div class="back">clips.outdrifted.com<a href="./" style="display: block;"><span class="link-spanner"></span></a></div>
				<div class="error" style="border-top-left-radius: 0px; border-top-right-radius: 0px;margin:0px">Clip not found.</div>
				`);
			}

			String.prototype.replaceAll = function(str1, str2, ignore) {
				return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
			}

			var meta_description = `<meta property="og:description" content="`;
			if (video.game != "Other" || video.people.length || video.description) {
				if (video.game) meta_description += `${video.game} · `
				if (video.description) meta_description += `„${video.description}“ · `
				if (video.people.length) meta_description += `${video.people.join(', ')} · `
			}
			meta_description += `${formatDate(video.dateRecorded)}" />`;

			$('head').append(`
				<meta property="og:title" content="${video.title.replaceAll(`"`, "&quot;")} | Clip by ${video.recordedBy || video.uploadedBy}" />
				<meta property="og:url" content="${window.location.hostname}?v=${video.id}" />
				${meta_description}
				<meta property="og:image" content="${video.thumbnail.medium.url}" />
			`)

			$('title').html(`${video.title.replaceAll(`"`, "&quot;")} - Clips`);

			// Badges
			var privclip = "";
			var highclip = "";
			var newclip = "";
			if (video.private) privclip = `<span title="This clip won't show up in the clip list. It can only be accessed via direct link." class="clip-alert">Private clip</span>`;
			if (video.highlight) highclip = `<span title="This clip will be highlighted in the clip list." class="clip-highlighted-alert">Highlighted clip</span>`;
			if (video.dateAddedAgo < 432000000) newclip = `<span title="This clip was uploaded in the last 5 days." class="clip-alert">New clip</span>`;
			
			var gameicon = "";
			if (gameLib[video.game] && gameLib[video.game].icon) gameicon = `<span class="game-icon"><img draggable="false" src="${gameLib[video.game].icon}"></img></span>`;
			var game_linkstart = "", game_linkend = "";
			if (gameLib[video.game] && gameLib[video.game].link) {
				game_linkstart = `<a href="./?g=${video.game}">`;
				game_linkend = `</a>`;
			}

			//${video.people ? video.people.join(', ') : "No people specified."}
			var video_people = "No people specified";
			if (video.people) {
				var html = `<div class="video_people_detailed_list">`;
				video.people.forEach(person => {
					if (nameLib[person]) {
						console.log(nameLib[person]);
						html += `<div class="video_people_detailed"><a href="${`./?p=${person}`}"><img draggable="false" src="${nameLib[person].icon}"></img>${person}</a></div>`;
					} else html += `<div class="video_people_detailed">${person}</div>`;
				})
				video_people = html + `</div>`;
			}

			var video_recordedby = "";
			if (video.recordedBy != video.uploadedBy) {
				video_recordedby = video.recordedBy;
				if (nameLib[video_recordedby]) {
					video_recordedby = `<div class="video_people_detailed"><a href="${`./?p=${video_recordedby}`}"><img draggable="false" src="${nameLib[video_recordedby].icon}"></img>${video_recordedby}</a></div>`;
				}
				video_recordedby = `<tr>
				<td>Recorded by</td>
				<td>${video_recordedby}</td>
				</tr>`
			}

			var video_uploadedby = video.uploadedBy;
			if (nameLib[video_uploadedby]) {
				video_uploadedby = `<div class="video_people_detailed"><a href="${`./?p=${video_uploadedby}`}"><img draggable="false" src="${nameLib[video_uploadedby].icon}"></img>${video_uploadedby}</a></div>`;
			}

			if (video.type == "youtube") {
				$('.main').append(`
				<div class="vid-direct">
					<div class="back">clips.outdrifted.com<a href="./" style="display: block;"><span class="link-spanner"></span></a></div>
					<div class="video-player-wrapper">
						<div class="video-player-loading">Loading...</div>
						<iframe class="video-player" src="https://www.youtube.com/embed/${urlVideo}?rel=0&vq=hd1080&amp;playlist=${urlVideo}&amp;loop=1&amp;autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe>
					</div>

					<div class="video-info">
					<div id="main-desc">
					<div id="vid-title">${video.title}<div class="clip-alerts">${privclip}${newclip}${highclip}</div></div>
					<div id="vid-desc">${video.description ? `"${video.description}"` : ""}</div>
					</div>
						<table>
							${video.game != "Other" ? `
							<tr>
								<td>Game</td>
								<td>${game_linkstart}${gameicon}${video.game || "No game specified."}${game_linkend}</td>
							</tr>
							` : ``}
							${video.people.length ? `
							<tr>
								<td>People in clip</td>
								<td>${video_people}</td>
							</tr>` : ""}
							${video.recordedBy ? `
							${video_recordedby}
							` : ``}
							<tr>
								<td>Uploaded by</td>
								<td>${video_uploadedby}</td>
							</tr>
							<tr>
								<td>Date uploaded</td>
								<td>${formatDateWithTime(video.dateAdded)}</td>
							</tr>
							${video.dateRecorded != Infinity ? `<tr>
							<td>Date recorded</td>
							<td>${formatDate(video.dateRecorded)}</td>
						</tr>` : ""}
						</table>
					</div>
				</div>
				`)
			} else if (video.type == "medal") {
				var iframe = video.medalIframe.substring(0, 8) + `class="video-player"` + video.medalIframe.substring(7);

				$('.main').append(`
				<div class="vid-direct">
					<div class="back">clips.outdrifted.com<a href="./" style="display: block;"><span class="link-spanner"></span></a></div>
					<div class="video-player-wrapper">
						<div class="video-player-loading">Loading...</div>
						${iframe}
					</div>

					<div class="video-info">
					<div id="main-desc">
					<div id="vid-title">${video.title}<div class="clip-alerts">${newclip}${highclip}</div></div>
					<div id="vid-desc">${video.description ? `"${video.description}"` : ""}</div>
					</div>
						<table>
							${video.game != "Other" ? `
							<tr>
								<td>Game</td>
								<td>${game_linkstart}${gameicon}${video.game || "No game specified."}${game_linkend}</td>
							</tr>
							` : ``}
							${video.people.length ? `
							<tr>
								<td>People in clip</td>
								<td>${video_people}</td>
							</tr>` : ""}
							${video.recordedBy ? `
							${video_recordedby}
							` : ``}
							<tr>
								<td>Uploaded by</td>
								<td>${video_uploadedby}</td>
							</tr>
							<tr>
								<td>Date uploaded</td>
								<td>${formatDateWithTime(video.dateAdded)}</td>
							</tr>
						</table>
					</div>
				</div>
				`)
			}
		}

		var lastUpload = videos.sort(sortByProperty(`-dateAdded`))[0];

		/* 
		// Dynamic Clip sources
		var clip_sources = 0;
		if (Object.keys(playlists).length) {
			clip_sources = `${Object.keys(playlists).length} (`;

			for (const [key, val] of Object.entries(playlists)) {
				clip_sources += `${val.length} ${key}`;
			}

			clip_sources += ")";
		}
		*/

		var footer_clips = videos.length;
		if (videos.length != videosNoPrivate.length) {
			footer_clips = `${videos.length} (${videosNoPrivate.length} public, ${videos.length - videosNoPrivate.length} private)`;
		}

		$(`.main`).append(`
			<div class="footer">
				<span id="footer-top">Outdrifted © ${new Date().getFullYear()}<br/></span>
				Clips: ${footer_clips}<br/>
				Latest upload: <a href="./?v=${lastUpload.id}">${formatDateWithTime(lastUpload.dateAdded)} by ${lastUpload.uploadedBy}</a><br/>
				Sources: ${source.playlists.youtube.length + source.playlists.medal.length} (${source.playlists.youtube.length} YouTube, ${source.playlists.medal.length} Medal.tv)<br/>
				Load time: ${Math.floor(performance.now()-startTimer)} ms<br/>
				<span id="footer-more">Show more</span>
			</div>
		`);
	}

	function getGames(videosFormatted) {
		var result = [];
		videosFormatted.forEach(e => {
			if (!result.includes(e.game)) {
				result.push(e.game);
			}
		});
		return result;
	}

	function getUploaders(videosFormatted) {
		var result = [];
		videosFormatted.forEach(e => {
			if (!result.includes(e.recordedBy)) {
				result.push(e.recordedBy);
			}
		});
		return result;
	}

	function formatVideosMedal(videos) {
		var vidArray = [];

		videos.contentObjects.forEach(vid => {
			var vidData = {
				dateAdded: new Date(vid.createdTimestamp),
				dateAddedAgo: Math.abs(new Date() - new Date(vid.createdTimestamp)),
				description: null,
				game: vid.categoryId,
				highlight: false,
				id: vid.contentId.replace('cid', ''),
				people: [],
				private: false,
				thumbnail: {
					medium: {
						url: vid.contentThumbnail
					}
				},
				title: vid.contentTitle,
				uploadedBy: vid.credits.replace('Credits to ', '').split(' (')[0],
				recordedBy: vid.credits.replace('Credits to ', '').split(' (')[0],
				medalIframe: vid.embedIframeCode,
				type: 'medal'
			};

			vidData.dateRecorded = vidData.dateAdded;
			vidData.dateRecordedAgo = vidData.dateAddedAgo;

			for (const [key, val] of Object.entries(nameLib)) {
				if (val.aliases.includes(vid.credits.replace('Credits to ', '').split(' (')[0].toLowerCase())) {
					vidData.uploadedBy = key
					vidData.recordedBy = key
				};
			}

			for (const [key, val] of Object.entries(gameLib)) {
				if (val.aliases.includes(vid.categoryId)) vidData.game = key;
			}

			vidArray.push(vidData)
		})

		return vidArray;
	}

	function formatVideos(videos) {
		var videoList = [];
		videos.forEach(video => {
			var r = null;

			if (video.snippet.description.includes("This video is")) return r;

			r = {
				id: video.snippet.resourceId ? video.snippet.resourceId.videoId : video.id,
				thumbnail: video.snippet.thumbnails,
				dateAdded: video.snippet.publishedAt,
				dateAddedAgo: Math.abs(new Date() - new Date(video.snippet.publishedAt)),
				uploadedBy: video.snippet.channelTitle,
				type: 'youtube'
			}

			for (const [key, val] of Object.entries(nameLib)) {
				if (val.aliases.includes(r.uploadedBy.toLowerCase())) r.uploadedBy = key;
			}

			var description = video.snippet.description;

			//#region Attributes
			if (description.includes("people(")) {
				var searchFor = `people(`;
				var len = searchFor.length;

				r.people = description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				).split(',');

				r.people = r.people.map(s => s.trim());

				var peopleArray = [];
				r.people.forEach(person => {
					var name = person;
					for (const [key, val] of Object.entries(nameLib)) {
						if (val.aliases.includes(name.toLowerCase())) name = key;
					}
					peopleArray.push(name);
				})
				r.people = peopleArray;
				r.people.sort();
			} else { r.people = [] }

			if (description.includes("title(")) {
				var searchFor = `title(`;
				var len = searchFor.length;

				r.title = description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				);
			} else { r.title = video.snippet.title }

			if (description.includes("game(")) {
				var searchFor = `game(`;
				var len = searchFor.length;

				r.game = description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				);

				for (const [game, props] of Object.entries(gameLib)) {
					if (props.aliases.includes(r.game.toLowerCase())) r.game = game;
				}
			} else { r.game = "Other" }

			if (description.includes("description(")) {
				var searchFor = `description(`;
				var len = searchFor.length;

				r.description = description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				);
			} else { r.description = null }

			if (description.includes("recordedBy(")) {
				var searchFor = `recordedBy(`;
				var len = searchFor.length;

				r.recordedBy = description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				);

				for (const [key, val] of Object.entries(nameLib)) {
					if (val.aliases.includes(r.recordedBy.toLowerCase())) r.recordedBy = key;
				}
			} else {
				r.recordedBy = r.uploadedBy;
			}

			if (description.includes("date(")) {
				var searchFor = `date(`;
				var len = searchFor.length;

				r.dateRecorded = new Date(description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				));

				r.dateRecordedAgo = Math.abs(new Date() - new Date(r.dateRecorded.getTime()));
			} else { /*r.dateRecorded = Infinity; r.dateRecordedAgo = Infinity;*/r.dateRecorded = r.dateAdded; r.dateRecordedAgo = r.dateAddedAgo }

			/* Makes the video not show up in clip browser */
			if (description.includes("private()")) {
				r.private = true;
			} else { r.private = false }

			if (description.includes("highlight()")) {
				r.highlight = true;
			} else { r.highlight = false }
			//#endregion

			// OVERRIDES
			if (Object.keys(overrides).includes(r.id)) {
				for (const [key, val] of Object.entries(overrides[r.id])) {
					r[key] = val;
				}
			}

			videoList.push(r)
		});

		return videoList;
	}

	function formatDate(date) {
		var d = new Date(date),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();
	
		if (month.length < 2) 
			month = '0' + month;
		if (day.length < 2) 
			day = '0' + day;
	
		return [year, month, day].join('-');
	}

	function formatDateWithTime(date_) {
		let date = new Date(date_);

		// adjust 0 before single digit date
		let day = ("0" + date.getDate()).slice(-2);

		// current month
		let month = ("0" + (date.getMonth() + 1)).slice(-2);

		// current year
		let year = date.getFullYear();

		// current hours
		let hours = date.getHours();
		if (hours < 10) hours = "0" + date.getHours();

		// current minutes
		let minutes = date.getMinutes();
		if (minutes < 10) minutes = "0" + date.getMinutes();

		// prints date & time in YYYY-MM-DD HH:MM:SS format
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	}

	function sortByProperty(property) {
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a,b) {
			/* next line works with strings and numbers, 
			* and you may want to customize it to your needs
			*/
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		}
	}

	function removeUnavailable(input) {
		var returning = [];
		input.items.forEach(function(item) {
			if (!item.snippet.description.startsWith("This video is")) {
				returning.push(item);
			}
		});
		return returning;
	}

	function removePrivates(videosFormatted) {
		var returnable = [];
		videosFormatted.forEach(item => {
			if (!item.private) {
				returnable.push(item);
			}
		});
		return returnable;
	}

	$( "#select-sort, #select-game, #select-uploader" ).change(function() {
		var sort = $('#select-sort').find(":selected").val();
		var game = $('#select-game').find(":selected").val();
		var uploader = $('#select-uploader').find(":selected").val();

		if (game) game = `?g=${game}`
		if (sort) sort = `?s=${sort}`
		if (uploader) uploader = `?u=${uploader}`

		var url = window.location.href.split('?')[0];
		window.location.href = `${url}${game}${sort}${uploader}`
	});

	$('body').on('click','#footer-more',function(){
		$('#footer-more').remove();
		$(`.main`).append(`<a href="mailto:contact@outdrifted.com">Contact web admin: contact@outdrifted.com</a><br>`)
		if (selected_vid) {
			if (selected_vid.type == "medal") {
				$(`.main`).append(`Direct link: <a href="https://medal.tv/clips/${selected_vid.id}">https://medal.tv/clips/${selected_vid.id}</a><br>`)
			} else if (selected_vid.type == "youtube") {
				$(`.main`).append(`Video direct link: <a href="https://youtube.com/watch?v=${selected_vid.id}">https://youtube.com/watch?v=${selected_vid.id}</a><br>`)
			}
		}
		$(`.main`).append(`Favicon made by <a href="https://www.flaticon.com/authors/prosymbols-premium" title="Prosymbols Premium">Prosymbols Premium</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a><hr>`)
		$(`.main`).append(`nameLib.js<pre class="footer-code">${JSON.stringify(nameLib, null, `\t`)}</pre>`)
		$(`.main`).append(`gameLib.js<pre class="footer-code">${JSON.stringify(gameLib, null, `\t`)}</pre>`)
	});
});
