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
	const urlVideo = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?v=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
	})();

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
	const urlSorting = (function() {
		if (urlData == null) return null;
		var data = urlData.split('?s=').pop().split('?')[0];
		if (data == "") return null;
		return decodeURI(data);
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
	//#endregion

	getVideos(null);
	function getVideos(token) {
		var options = {
			part: 'snippet',
			key: 'AIzaSyCb62u0hNUTyUtcdOi-VbZtSNtisI7uCB0',
			maxResults: 50,
			playlistId: 'PLeRA6x39PellI87s8Qh6s8ETDlpzsrAI0',
			url: 'https://www.googleapis.com/youtube/v3/playlistItems'
		}

		if (token != null) {options.pageToken = token}

		$.getJSON(options.url, options, function (data) {
			//vids = data;
			//if ('nextPageToken' in data) {} else {reachLastPage = true;}
			tokenChecker(data);
		})
	}

	var storage = [];
	function tokenChecker(data) {
		storage.push(data);
		if ('nextPageToken' in data) {getVideos(data.nextPageToken)} else {videoMerge(storage)}
	}

	function videoMerge(data) {
		if (data.length > 1) {
			var result = null;
			data.forEach(e => {
				if (result == null) return result = e;
				e.items.forEach(i => {
					result.items.push(i)
				})
			})
			main(result);
		} else {
			main(data[0]);
		}
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

	function main(data) {
		var sortingProperty = "";
		var sortingReverse = "";
		switch (urlSorting) {
			case '1':
				sortingProperty = "dateAddedAgo";
				sortingReverse = "-";
				break;

			case '2':
				sortingProperty = "dateRecordedAgo";
				sortingReverse = "";
				break;

			case '3':
				sortingProperty = "dateRecordedAgo";
				sortingReverse = "-";
				break;
		
			default:
				sortingProperty = "dateAddedAgo";
				sortingReverse = "";
				break;
		}
		const videos = formatVideos(removeUnavailable(data)).sort(sortByProperty(`${sortingReverse}${sortingProperty}`));
		const videosNoPrivate = removePrivates(videos);

		console.log(videosNoPrivate);

		$(`.loading`).remove();
		
		if (!urlVideo) {
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

			if (urlSorting && (urlSorting == 1 || urlSorting == 2 || urlSorting == 3)) {
				$('#select-sort').append(`<option value="">Uploaded date (descending)</option>`);
				
				if (urlSorting == 1) {
					$('#select-sort').append(`<option value="1" selected="selected">Uploaded date (ascending)</option>`);
				} else {
					$('#select-sort').append(`<option value="1">Uploaded date (ascending)</option>`);
				}

				if (urlSorting == 2) {
					$('#select-sort').append(`<option value="2" selected="selected">Recorded date (descending)</option>`);
				} else {
					$('#select-sort').append(`<option value="2">Recorded date (descending)</option>`);
				}

				if (urlSorting == 3) {
					$('#select-sort').append(`<option value="3" selected="selected">Recorded date (ascending)</option>`);
				} else {
					$('#select-sort').append(`<option value="3">Recorded date (ascending)</option>`);
				}
			} else {
				$('#select-sort').append(`<option value="" selected="selected">Uploaded date (descending)</option>`);
				$('#select-sort').append(`<option value="1">Uploaded date (ascending)</option>`);
				$('#select-sort').append(`<option value="2">Recorded date (descending)</option>`);
				$('#select-sort').append(`<option value="3">Recorded date (ascending)</option>`);
			}

			$('.options').css('display', 'flex');

			videosNoPrivate.forEach(video => {
				if (urlGame && video.game != urlGame) return;

				var vid_desc = "";
				var vid_game = `<div class="video-game">‎</div>`;
				var vid_people = "";
	
				if (video.description) vid_desc = `<div class="video-description">"${video.description}"</div>`
				if (video.game) vid_game = `<div class="video-game">${video.game}</div>`
				//if (video.people && video.people.length) vid_people = `<div class="video-people">${video.people.join(', ')}</div>`
	
				$('.video-list').append(`
				<div class="video" id="clip-${video.id}">
					<img class="video-thumbnail" draggable="false" src="${video.thumbnail.medium.url}"></img>
					<div class="description">
						<div>
							<div class="video-title">${video.title}</div>
							${vid_people}
							${vid_desc}
						</div>
						<div class="video-footer">
							<div class="video-date">${formatDate(video.dateRecorded || video.dateAdded)}</div>
							${vid_game}
						</div>
					</div>
				</div>
				`);
			})

			if ($('.video-list').children().length == 0) {
				$('.main').append(`<div class="error">No clips found.</div>`)
			}
		} else {
			// Video specified
			var video = videos.find(v => v.id == urlVideo);

			if (!video) {
				$('.main').append(`
				<div class="back">< Back</div>
				<div class="error" style="border-top-left-radius: 0px; border-top-right-radius: 0px;margin:0px">Clip not found.</div>
				`);
			}

			String.prototype.replaceAll = function(str1, str2, ignore) {
				return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
			} 
			
			$('head').append(`
				<meta property="og:title" content="${video.title.replaceAll(`"`, "&quot;")} | Clip by ${e.recordedBy}" />
				<meta property="og:url" content="${window.location.hostname}?v=${video.id}" />
				<meta property="og:description" content="${video.game ? video.game : "Unknown game"} - ${video.people.join(', ')}\n${formatDate(e.dateRecorded)}" />
				<meta property="og:image" content="${e.thumbnail.medium.url}" />
			`)

			$('.main').append(`
			<div class="back">< Back</div>
			<div class="video-player-wrapper">
				<div class="video-player-loading">Loading...</div>
				<iframe class="video-player" src="https://www.youtube.com/embed/${urlVideo}?rel=0&amp;playlist=${urlVideo}&amp;loop=1&amp;autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe>
			</div>
			<div class="video-info">
			<div><b>Title: </b>${video.title}</div>
			<div><b>Description: </b>${video.description || "No description specified."}</div>
			<div><b>Game: </b>${video.game || "No game specified."}</div>
			<div><b>People: </b>${video.people ? video.people.join(', ') : "No people specified."}</div>
			<div><b>Recorded by: </b>${video.recordedBy}</div>
			<div><b>Date uploaded: </b>${formatDateWithTime(video.dateAdded)}</div>
			<div><b>Date recorded: </b>${video.dateRecorded ? formatDate(video.dateRecorded) : "No date specified."}</div>
			</div>
			`)
		}
	}

	function formatVideos(videos) {
		var videoList = [];
		videos.forEach(video => {
			var r = null;

			if (video.snippet.description.includes("This video is")) return r;

			r = {
				id: video.snippet.resourceId.videoId,
				title: video.snippet.title,
				thumbnail: video.snippet.thumbnails,
				dateAdded: video.snippet.publishedAt,
				dateAddedAgo: Math.abs(new Date() - new Date(video.snippet.publishedAt))
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

				r.people = r.people.map(s => s.trim()).sort();
			} else { r.people = [] }

			if (description.includes("game(")) {
				var searchFor = `game(`;
				var len = searchFor.length;

				r.game = description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				);
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
			} else { r.recordedBy = 'yummy' }

			if (description.includes("date(")) {
				var searchFor = `date(`;
				var len = searchFor.length;

				r.dateRecorded = new Date(description.substring(
					description.lastIndexOf(searchFor) + len, 
					description.indexOf(")", description.lastIndexOf(searchFor) + len)
				));

				r.dateRecordedAgo = Math.abs(new Date() - new Date(r.dateRecorded.getTime()));
			} else { r.dateRecorded = Infinity; r.dateRecordedAgo = Infinity; }

			/* Makes the video not show up in clip browser */
			if (description.includes("private()")) {
				r.private = true;
			} else { r.private = false }

			/* Shares the video to Discord */
			if (description.includes("share()")) {
				r.share = true;
			} else { r.share = false }
			//#endregion

			videoList.push(r)

			//#region 
			/*
			if (video.snippet.description.includes("This video is")) return r;

			var desc = video.snippet.description.substring(0, 260);
			var vid = video.snippet.resourceId.videoId;
			var game = desc.split(';')[0];
			var desc = desc.substring(desc.indexOf(";") + 1);
			var date_ = desc.split(';')[1];
			var desc = video.snippet.description.substring(0, 260);
			var desc = desc.substring(desc.indexOf(";") + 1).split(';')[0];
			var atributes = video.snippet.description.substring(video.snippet.description.lastIndexOf(";") + 1);
			var unixDate = parseInt((new Date(date_).getTime() / 1000).toFixed(0));
			var addedToPlaylist_ = video.snippet.publishedAt
			
			//addedToPlaylistMS_
			var a = new Date(addedToPlaylist_);
			var b = new Date();
			var addedToPlaylistMS_ = Math.abs(b-a);

			var people = [];
			if (atributes.includes("people(")) {
				var searchFor = `people(`;
				var len = searchFor.length;

				var users = atributes.substring(
					atributes.lastIndexOf(searchFor) + len, 
					atributes.indexOf(")", atributes.lastIndexOf(searchFor) + len)
				);
				people = users.split(',');
			}
			if (people) {
				people.forEach(e => {
					if (game == urlGame) {
						//peopleInVideosTotal.push(e);
					}
				})
			}

			var recordedby = "";
			if (atributes.includes("recordedBy(")) {
				var searchFor = `recordedBy(`;
				var len = searchFor.length;

				var recorder = atributes.substring(
					atributes.lastIndexOf(searchFor) + len, 
					atributes.indexOf(")", atributes.lastIndexOf(searchFor) + len)
				);
				recordedby = recorder;
			}

			r = {
				title: video.snippet.title,
				description: desc,
				thumbnail: video.snippet.thumbnails.medium.url,
				game: game,
				id: vid,
				dateUnix: unixDate,
				date: date_,
				attr: atributes,
				people: people.sort(),
				recordedBy: recordedby,
				addedToPlaylist: addedToPlaylist_,
				addedToPlaylistAgo: addedToPlaylistMS_
			};
			*/
			//#endregion

			//videoList.push(r);
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
		let date_ob = new Date(date_);

		// adjust 0 before single digit date
		let date = ("0" + date_ob.getDate()).slice(-2);

		// current month
		let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

		// current year
		let year = date_ob.getFullYear();

		// current hours
		let hours = date_ob.getHours();
		if (hours < 10) hour = "0" + date_ob.getHours();

		// current minutes
		let minutes = date_ob.getMinutes();
		if (minutes < 10) minutes = "0" + date_ob.getMinutes();

		// prints date & time in YYYY-MM-DD HH:MM:SS format
		return year + "-" + month + "-" + date + " " + hours + ":" + minutes;
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
			if (!item.snippet.description.includes("This video is")) {
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

	function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

	function sortUpdate() {
		console.log('sumthin changed :))DDD');
	}

	$( "#select-sort, #select-game" ).change(function() {
		var sort = $('#select-sort').find(":selected").val();
		var game = $('#select-game').find(":selected").val();

		if (game) game = `?g=${game}`
		if (sort) sort = `?s=${sort}`

		console.log(sort, game)

		var url = window.location.href.split('?')[0];
		window.location.href = `${url}${game}${sort}`
	});

	$('body').on('click', '.video', function() {
		var id = $(this).attr('id').replace('clip-','');
		window.location.href = `${window.location.href}?v=${id}`
	});

	$('body').on('click', '.back', function() {
		var urlVideo = (function() {
			if (urlData == null) return null;
			var data = urlData.split('?v=').pop().split('?')[0];
			if (data == "") return null;
			return decodeURI(data);
		})();
		
		window.location.href = window.location.href.replace(`?v=${urlVideo}`, '')
	});
});
