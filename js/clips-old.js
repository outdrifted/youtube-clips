$(document).ready(function() {
	$('.footer').append(`${new Date().getFullYear()} © Outdrifted`);

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
			key: config.api,
			maxResults: 50,
			playlistId: config.playlist,
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
		const videos = formatVideos(removeUnavailable(data)).sort(sortByProperty('dateAddedAgo'));
		const videosNoPrivate = removePrivates(videos);
		const games = getGames(videosNoPrivate);

		/*
		var lowestDate = null;
		var highestDate = null;

		videos.forEach(e => {
			if (lowestDate == null) {lowestDate = new Date(e.dateAdded)} else {
				if (new Date(e.dateAdded) < lowestDate) {
					lowestDate = new Date(e.dateAdded)
				}
			}

			if (highestDate == null) {highestDate = new Date(e.dateAdded)} else {
				if (new Date(e.dateAdded) > highestDate) {
					highestDate = new Date(e.dateAdded)
				}
			}
		})
		*/
		
		if (!urlGame && !urlVideo) {
			/* IF IN MAIN MENU */

			//#region Adding buttons to games
			games.forEach(e => {
				$('.btn-list').append(`
					<a href="?g=${e}" class="btn full-width">${e}</a>
				`);
			})
			//#endregion

			//#region Recent Videos
			videosNoPrivate.forEach(e => {
				if (e.dateAddedAgo/1000 > 172800) return 0;

				if (!$('.clips').length) {
					$('.content').append(`
						<hr style="margin-top:25px;margin-bottom:25px;">
						<h2 class="text-center" style="margin-top: 0;">Recent Clips</h2>
						<div class="clips"></div>
					`);
				}

				//#region TimeMarkers
				var source = e.dateAdded;
				//if (urlSorting == 1 || urlSorting == 2) source = e.dateRecorded;

				function numDaysBetween(d2) {
					d1 = new Date(String(new Date()).split(':')[0].slice(0,-3));
					d2 = new Date(String(new Date(d2)).split(':')[0].slice(0,-3));
					var diff = Math.abs(d1.getTime() - d2.getTime());
					return diff / (1000 * 60 * 60 * 24);
				};

				if (!$('.timeMarkerToday').length && numDaysBetween(source) < 1) {
					$('.clips').append(`
						<h2 class="timeMarker timeMarkerToday">Today:</h2>
					`)
				}

				if (!$('.timeMarkerWeek').length && numDaysBetween(source) >= 1 && numDaysBetween(source) <= 7) {
					$('.clips').append(`
						<h2 class="timeMarker timeMarkerWeek">Past 7 Days:</h2>
					`)
				}

				if (!$('.timeMarkerOlder').length && numDaysBetween(source) > 7) {
					$('.clips').append(`
						<h2 class="timeMarker timeMarkerOlder">Older Than 7 Days:</h2>
					`)
				}
				//#endregion

				var video_description = "";
				var video_game = "";
				var video_people = "";
				var video_daterecorded = "";
				var video_recordedby = "";

				if (e.description) {
					video_description = `<i>„${e.description}“</i>`
				}

				if (e.game && e.game != "Other") {
					video_game = `<b>Game: </b>${e.game}`
				}

				if (e.people.length != 0) {
					video_people = `<b>People: </b>${e.people.join(', ')}`
				}

				if (e.dateRecorded && e.dateRecorded != Infinity) {
					video_daterecorded = `<b>Date recorded: </b>${formatDate(e.dateRecorded)}`
				}

				if (e.recordedBy && urlRecordedBy != null && urlRecordedBy.includes('yummy')) {
					video_recordedby = `<b>Recorded by </b>${e.recordedBy}`
				}

				var uploadingSpan = `<span class="badge badge-red" style="position: absolute; top: 0; right: 0;">Processing...</span>`;
				//<p><b>Date uploaded: </b>${formatDateWithTime(e.dateAdded)} </p>
				$('.clips').append(`
					<div id="clip-${e.id}" class="clip">
						<div class="clip-image-container clip-image">
							<img class="clip-image" src="${e.thumbnail.medium.url}">
						</div>
						<div class="clip-description">
							<h3>${e.title}</h3>
							<p>${video_description}</p>
							<p>${video_game}</p>
							<p>${video_people}</p>
							<p>${video_daterecorded}</p>
							<p><b>Date uploaded: </b>${dhm(e.dateAddedAgo)} ago</p>
							<p>${video_recordedby}</p>
						</div>
					</div>
				`)

				/*
				if ($(`#clip-${e.id} .clip-image-container`).find('img').width() == 120) {
					$(`#clip-${e.id}`).addClass('disabled');
				}
				*/
				
				$(`.clip.disabled`).append(uploadingSpan)
			});
			//#endregion
		} else {
			// NOT IN MAIN MENU
			if (urlGame) {
				// IF GAME SPECIFIED

				if (!$('.clips').length) {

					//Add BACK buttons etc.
					$('.content').append(`
						<div class="clips"></div>
					`);

					$('.btn-list').append(`
						<a onclick="window.location.href = window.location.href.split('?')[0]" class="btn full-width">Back</a>
						<a id="copyLink" class="btn full-width disabled">Copy link to video</a>
						<a id="filterClips" class="btn full-width">Filter and sort clips</a>
					`);

					//#region Filtering/sorting container
					$(`
						<div class="filterClipsContainer">
							<h2 class="text-center">Sorting</h2><hr>
							<div id="checkboxes-1" class="checkboxes">
								<div>
									<input type="radio" id="sorting1" name="sorting">
									<label for="sorting1">Recording date (ascending)</label>
								</div>
								<div>
									<input type="radio" id="sorting2" name="sorting">
									<label for="sorting2">Recording date (descending)</label>
								</div>
								<div>
									<input type="radio" id="sorting3" name="sorting">
									<label for="sorting3">Uploaded date (ascending)</label>
								</div>
								<div>
									<input type="radio" id="sorting4" name="sorting">
									<label for="sorting4">Uploaded date (descending)</label>
								</div>
							</div>
						</div>
					`).insertAfter(`#filterClips`);
					
					if (urlDate || urlPeople || urlRecordedBy || urlSorting) {
						$(`
							<p id="sortingWarning" class="warning">

							</p>
						`).insertAfter(`.btn-list`);

						$('#sortingWarning').html("<b>Clips have been sorted or filtered.</b>")

						if (urlPeople || urlRecordedBy) {
							if (urlPeople) $('#sortingWarning').html(function(index, currentcontent) {return currentcontent + ` Showing clips that contain ${urlPeople.join(', ')}.`})
							if (urlRecordedBy) $('#sortingWarning').html(function(index, currentcontent) {return currentcontent + ` Showing clips that were recorded by ${urlRecordedBy.join(', ')}.`})
						}

						if (urlDate) {
							if (urlDate[0].split('T')[0] != urlDate[1].split('T')[0]) {
								$('#sortingWarning').html(function(index, currentcontent) {return currentcontent + ` Showing clips that were uploaded between ${urlDate[0].split('T')[0]} and ${urlDate[1].split('T')[0]}.`})
							} else {
								$('#sortingWarning').html(function(index, currentcontent) {return currentcontent + ` Showing clips that were uploaded on ${urlDate[0].split('T')[0]}.`})
							}
						}

						if (urlSorting) {
							$('#sortingWarning').html(function(index, currentcontent) {return currentcontent + ` Sorting clips by ${$(`label[for^="sorting${urlSorting}"]`).map((_,e) => e).get()[0].innerHTML.toLowerCase()}.`})
						}

						$('#sortingWarning').html(function(index, currentcontent) {return currentcontent + `<br><a id="resetFiltering" onclick="window.location.href = window.location.href.split('?')[0]+\`?g=${urlGame}\`">Click here to stop sorting and filtering.</a>`})
					}
					
					const peopleList = [];
					videosNoPrivate.forEach(e => {
						if (urlGame != e.game) return 0;

						if (e.people != null) {
							e.people.forEach(i => {
								if (!peopleList.includes(i)) peopleList.push(i);
							});
						}
					});

					const recordedByList = [];
					videosNoPrivate.forEach(e => {
						if (urlGame != e.game) return 0;

						let i = e.recordedBy;

						if (i != null) {
							if (!recordedByList.includes(i)) recordedByList.push(i);
						} else {
							if (!recordedByList.includes('yummy')) recordedByList.push('yummy');
						}
					});

					var lowestDate = null;
					var highestDate = null;

					videosNoPrivate.forEach(e => {
						if (urlGame != e.game) return 0;

						if (lowestDate == null) {lowestDate = new Date(e.dateAdded)} else {
							if (new Date(e.dateAdded) < lowestDate) {
								lowestDate = new Date(e.dateAdded)
							}
						}

						if (highestDate == null) {highestDate = new Date(e.dateAdded)} else {
							if (new Date(e.dateAdded) > highestDate) {
								highestDate = new Date(e.dateAdded)
							}
						}
					})

					if (recordedByList.length != 0 || peopleList.length != 0) {
						$('<h2 id="filtering-Filtering" class="text-center">Filtering</h2><hr id="filteringHR">').insertAfter(`.checkboxes`)
					}

					if ((lowestDate && highestDate) != null /*&& $(window).width() > 985*/) {
						/*
						$(`
							<h3 class="text-center">Filter by upload date</h3>
							<input id="daterangepicker" style="border-style:none;height: 25px" class="center full-width" value="Click here to select date">
						`).insertAfter(`#filteringHR`);
							
						$('#daterangepicker').dateRangePicker({
							autoClose: true,
							startDate: lowestDate,
							endDate: highestDate,
							startOfWeek: 'monday',
							singleMonth: true
						});
						*/

						$(`
							<h3 class="text-center">Filter by upload date</h3>
							<input type="text" id="daterangepicker" style="border-style:none;height: 25px" class="center full-width" readonly value="Click here to select a date"/>
						`).insertAfter(`#filteringHR`);

						if (urlDate) {
							$('input[id="daterangepicker"]').val(`${urlDate[0].split('T')[0]} - ${urlDate[1].split('T')[0]}`)
						}

						$('input[id="daterangepicker"]').daterangepicker({
							minDate: lowestDate,
							maxDate: highestDate,
							autoUpdateInput: false,
							opens: 'center',
							autoApply: true,
							"locale": {
								"format": "YYYY-MM-DD",
								"separator": " - ",
								"applyLabel": "Apply",
								"cancelLabel": "Cancel",
								"fromLabel": "From",
								"toLabel": "To",
								"customRangeLabel": "Custom",
								"weekLabel": "W",
								"daysOfWeek": [
									"Su",
									"Mo",
									"Tu",
									"We",
									"Th",
									"Fr",
									"Sa"
								],
								"monthNames": [
									"January",
									"February",
									"March",
									"April",
									"May",
									"June",
									"July",
									"August",
									"September",
									"October",
									"November",
									"December"
								],
								"firstDay": 1
							}
						}, function(start, end, label) {
							start = start.format('YYYY-MM-DD');
							end = end.format('YYYY-MM-DD');

							$('input[id="daterangepicker"]').val(`${start} - ${end}`)
						});
					}

					if (recordedByList.length > 1) {
						$(`
								<h3 class="text-center">Filter by who recorded clip</h3>
								<div id="checkboxes-3" class="checkboxes"></div>
							`).insertAfter(`#filteringHR`);

							for (let i = 0; i < recordedByList.length; i++) {
								const e = recordedByList[i];
	
								$(`#checkboxes-3`).append(`
									<div>
										<input type="checkbox" id="filtering-2-${e}">
										<label for="filtering-2-${e}">${e}</label>
									</div>
								`)
							}
					}

					if (peopleList.length != 0) {
						$(`
							<h3 class="text-center">Filter by people in clip</h3>
							<div id="checkboxes-2" class="checkboxes"></div>
						`).insertAfter(`#filteringHR`);

						for (let i = 0; i < peopleList.length; i++) {
							const e = peopleList[i];

							$(`#checkboxes-2`).append(`
								<div>
									<input type="checkbox" id="filtering-1-${e}">
									<label for="filtering-1-${e}">${e}</label>
								</div>
							`)
						}
					}

					$('.filterClipsContainer').append(`<a id="filterClipsConfirm" style="margin:0;" class="btn full-width">Confirm</a>`)

					if (urlSorting) {
						for (let i = 0; i < 4; i++) {
							let num = i+1;
							if (num == urlSorting) {
								$(`#sorting${num}`).attr("checked", true);
							}
						}
					} else {
						$(`#sorting${4}`).attr("checked", true);
					}

					if (urlPeople) {
						for (var i = 0; i < urlPeople.length; i++) {
							var e = urlPeople[i];
							
							if ($(`#filtering-1-${e}`).length) {
								$(`#filtering-1-${e}`).attr("checked", true);
							}
						}
					}

					if (urlRecordedBy) {
						for (var i = 0; i < urlRecordedBy.length; i++) {
							var e = urlRecordedBy[i];
							
							if ($(`#filtering-2-${e}`).length) {
								$(`#filtering-2-${e}`).attr("checked", true);
							}
						}
					}

					//#endregion
				}

				videosNoPrivateSorted = videosNoPrivate;
				
				switch (urlSorting) {
					case "1": videosNoPrivateSorted.sort(sortByProperty('-dateRecordedAgo')); break;
					case "2": videosNoPrivateSorted.sort(sortByProperty('dateRecordedAgo')); break;
					case "3": videosNoPrivateSorted.sort(sortByProperty('-dateAddedAgo')); break;
					case "4": videosNoPrivateSorted = videosNoPrivate; break;
				}

				var foundVideos = 0;

				videosNoPrivateSorted.forEach(e => {
					//#region Checkers
					if (urlGame != e.game) return 0;

					if (urlDate) {
						if (new Date(e.dateAdded) < new Date(urlDate[0])) {return 0;}
						if (new Date(e.dateAdded) > new Date(urlDate[1])) {return 0;}
					}

					if (urlPeople) {
						if (!e.people) return 0;
						if (!urlPeople.every(r => e.people.includes(r))) return 0;
					}
					
					if (urlRecordedBy) {
						if (!e.recordedBy) return 0;
						if (!urlRecordedBy.some(r => e.recordedBy.includes(r))) return 0;
					}
					//#endregion

					//#region TimeMarkers
					var source = e.dateAdded;
					if (urlSorting == 1 || urlSorting == 2) source = e.dateRecorded;

					function numDaysBetween(d2) {
						d1 = new Date(String(new Date()).split(':')[0].slice(0,-3));
						d2 = new Date(String(new Date(d2)).split(':')[0].slice(0,-3));
						var diff = Math.abs(d1.getTime() - d2.getTime());
						return diff / (1000 * 60 * 60 * 24);
					};

					if (!$('.timeMarkerToday').length && numDaysBetween(source) < 1) {
						$('.clips').append(`
							<h2 class="timeMarker timeMarkerToday">Today:</h2>
						`)
					}

					if (!$('.timeMarkerWeek').length && numDaysBetween(source) >= 1 && numDaysBetween(source) <= 7) {
						$('.clips').append(`
							<h2 class="timeMarker timeMarkerWeek">Past 7 Days:</h2>
						`)
					}

					if (!$('.timeMarkerOlder').length && numDaysBetween(source) > 7) {
						$('.clips').append(`
							<h2 class="timeMarker timeMarkerOlder">Older Than 7 Days:</h2>
						`)
					}
					//#endregion

					foundVideos += 1;
	
					var video_description = "";
					var video_people = "";
					var video_daterecorded = "";
					var video_recordedby = "";

					if (e.description) {
						video_description = `<i>„${e.description}“</i>`
					}

					if (e.people.length != 0) {
						video_people = `<b>People: </b>${e.people.join(', ')}`
					}

					if (e.dateRecorded && e.dateRecorded != Infinity) {
						video_daterecorded = `<b>Date recorded: </b>${formatDate(e.dateRecorded)}`
					}

					if (e.recordedBy != 'yummy' || urlRecordedBy != null) {
						video_recordedby = `<b>Recorded by </b>${e.recordedBy}`
					}

					var uploadingSpan = `<span class="badge badge-red" style="position: absolute; top: 0; right: 0;">Processing...</span>`;
					
					$('.clips').append(`
						<div id="clip-${e.id}" class="clip">
							<div class="clip-image-container clip-image">
								<img class="clip-image" src="${e.thumbnail.medium.url}">
							</div>
							<div class="clip-description">
								<h3>${e.title}</h3>
								<p>${video_description}</p>
								<p>${video_people}</p>
								<p>${video_daterecorded}</p>
								<p><b>Date uploaded: </b>${formatDateWithTime(e.dateAdded)}</p>
								<p>${video_recordedby}</p>
							</div>
						</div>
					`)

					/*
					if ($(`#clip-${e.id} .clip-image-container`).find('img').width() == 120) {
						$(`#clip-${e.id}`).addClass('disabled');
					}
					*/
					
					$(`.clip.disabled`).append(uploadingSpan)
				});

				if (foundVideos < 1) {
					$('.clips').append(`
						<p class="warning"><b>No clips found.</b></p>
					`)
				}

				if (foundVideos < 2) {$(`#filterClips`).addClass('disabled')}
			} else {
				// IF VIDEO SPECIFIED

				var e = videos.find(o => o.id === urlVideo);
				if (!e) return window.location.href = `./clips`;

				//Buttons
				$('.btn-list').append(`
					<a onclick="window.location.href = window.location.href.split('?')[0]" class="btn full-width">Back</a>
				`);

				$('div.video').html(`
					<iframe class="video" src="https://www.youtube.com/embed/${urlVideo}?rel=0&playlist=${urlVideo}&loop=1&autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
				`);

				var video_description = "";
				var video_game = "";
				var video_people = "";
				var video_daterecorded = "";
				var video_recordedby = "";
				
				String.prototype.replaceAll = function(str1, str2, ignore) {
					return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
				} 
				
				$('head').append(`
					<meta property="og:title" content="${e.title.replaceAll(`"`, "&quot;")} | Clip by ${e.recordedBy}" />
					<meta property="og:url" content="${window.location.href}" />
					<meta property="og:description" content="${e.game + " - " + e.people.join(', ')}\n${formatDate(e.dateRecorded)}" />
					<meta property="og:image" content="${e.thumbnail.medium.url}" />
				`)

				if (e.description) {
					video_description = `<i>„${e.description}“</i>`
				}

				if (e.game && e.game != "Other") {
					video_game = `<b>Game: </b>${e.game}`
				}

				if (e.people.length != 0) {
					video_people = `<b>People: </b>${e.people.join(', ')}`
				}

				if (e.dateRecorded && e.dateRecorded != Infinity) {
					video_daterecorded = `<b>Date recorded: </b>${formatDate(e.dateRecorded)}`
				}

				if (e.recordedBy) {
					video_recordedby = `<b>Recorded by </b>${e.recordedBy}`
				}
				
				$('.content').append(`
					<div class="clip-description" style="padding: 0px;padding-top:10px;">
						<h3>${e.title}</h3>
						<p>${video_description}</p>
						<p>${video_game}</p>
						<p>${video_people}</p>
						<p>${video_daterecorded}</p>
						<p><b>Date uploaded: </b>${formatDateWithTime(e.dateAdded)} (${dhm(e.dateAddedAgo)} ago)</p>
						<p>${video_recordedby}</p>
					</div>
				`)
			}
		}

		$('.spinner').slideUp()
		$('.content').slideToggle( "slow", function() {});
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
	
	function dhm(t){
		var cd = 24 * 60 * 60 * 1000,
			ch = 60 * 60 * 1000,
			d = Math.floor(t / cd),
			h = Math.floor( (t - d * cd) / ch),
			m = Math.round( (t - d * cd - h * ch) / 60000),
			pad = function(n){ return n < 10 ? n : n; };
		if( m === 60 ){
			h++;
			m = 0;
		}
		if( h === 24 ){
			d++;
			h = 0;
		}

		function getEnding(number) {
			if (String(number).endsWith(1) && number.length == 0) {
				return "";
			} else {
				return "s";
			}
		}
		//return [d, pad(h), pad(m)].join(':');

		d = d;
		h = pad(h);
		m = pad(m);
		
		var result = []; //d + "day(s)", h + "hour(s)", m + "minute(s)"

		if (d != 0) {
			result.push(d + " day"+getEnding(d));
		}
		if (h != 0) {
			result.push(h + " hour"+getEnding(h));
		}
		if (m != 0) {
			result.push(m + " minute"+getEnding(m));
		}

		if (!result.length) {
			return "a couple of seconds";
		}
		
		return result.join(', ');
	}

	function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

	$('.content').on('click', '.clip', function() {
		if (!$(this).hasClass('disabled')) {
			var vidid = $(this).attr("id").substring($(this).attr("id").indexOf("-") + 1);
			if (!urlGame && !urlVideo) {
				if ($(this).hasClass('disabled')) return 0;
				window.location.href = `?v=${vidid}`;
			} else {
				$('div.video').html(`
					<iframe class="video" src="https://www.youtube.com/embed/${vidid}?rel=0&playlist=${vidid}&loop=1&autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
				`);
				scrollToTop();
			}

			if ($('#copyLink').length > 0) {
				$('#copyLink').removeClass('disabled');
			}
		}
	})

	$('.btn-list').on('click', '#copyLink', function () {
        function fallbackCopyTextToClipboard(text) {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            
            // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
        
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
        
            try {
                var successful = document.execCommand('copy');
                //var msg = successful ? 'Copied link to the video!' : 'I was unable to copy video link to your clipboard.';
                //alert(msg);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
        
            document.body.removeChild(textArea);
        }

		if (!$(this).hasClass('disabled')) {
			var videolink = $('iframe').attr('src');
			var domain = window.location.href.split('?')[0];
			var videoid = `?v=` + videolink.split("https://www.youtube.com/embed/").pop().split('&')[0].replace("?rel=0", "");
			fallbackCopyTextToClipboard(domain + videoid);
			window.open(videoid);
		}
	});
	
	$('.btn-list').on('click', '#filterClips', function () {
		if (!$(this).hasClass('disabled')) {
			$(".filterClipsContainer").slideToggle( "slow", function() {});
		}
	});

	$('.btn-list').on('click', '#filterClipsConfirm', function () {
		var _sorting = $(`input[id^="sorting"]:checked`).map((_,e) => e.id).get();
		var _people = $(`input[id^="filtering-1"]:checked`).map((_,e) => e.id).get();
		var _recorders = $(`input[id^="filtering-2"]:checked`).map((_,e) => e.id).get();
		var _recordersFull = $(`input[id^="filtering-2"]`).map((_,e) => e.id).get();
		var _dateSelection = $('input[id="daterangepicker"]').val();

		for (let i = 0; i < _people.length; i++) {
			const e = _people[i];
			_people[i] = e.replace("filtering-1-", "")
		}

		for (let i = 0; i < _recordersFull.length; i++) {
			const e = _recordersFull[i];
			_recordersFull[i] = e.replace("filtering-2-", "")
		}

		for (let i = 0; i < _recorders.length; i++) {
			const e = _recorders[i];
			_recorders[i] = e.replace("filtering-2-", "")
		}

		for (let i = 0; i < _sorting.length; i++) {
			const e = _sorting[i];
			_sorting[i] = e.replace("sorting", "")
		}

		var url = window.location.href.split('?')[0]+`?g=${urlGame}`;

		if (_people.length != 0) {
			url += "?p=";
			_people.forEach(e => {
				url += e + "&";
			});
			url = url.substring(0, url.length - 1);
		}

		if (!_recordersFull.every(i => _recorders.includes(i)) && _recorders.length) {
			url += "?r=";
			_recorders.forEach(e => {
				url += `${e}&`;
			});
			url = url.substring(0, url.length - 1);
		}

		if (_sorting.length != 0) {
			if (_sorting != 4) {
				url += `?s=${_sorting}`;
			}
		}

		if (_dateSelection != "Click here to select a date") {
			var dat = _dateSelection.split(' - ');
			url += `?d=${dat[0]}&${dat[1]}`;
		}

		window.location.href = url;
	});
});
