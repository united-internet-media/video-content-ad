(function() {
    var playerIframe, iframeContainer, iframeContainerChild, playbackTimeout,
    intersectionObserver, eventSource, eventOrigin, closeButton, currentVideoTitle,
	articleObserver, article, belowArticle, inSticky,
	headerObserver, headerTag, headerInView,
    playerFrameWidth, playerFrameHeight = null;
    window.addEventListener("message", messageHandler, false);
    function messageHandler(e) {
        var messageArr, playerFunc, playerMessage, matchingResult = null;
        if( typeof e.data === "string" && e.data.split("|")[0] == "BPLR" ) {
            //console.log("POSTMESSAGE event", e);
            messageArr = e.data.split("|");
            playerFunc = messageArr[2];
            playerMessage = messageArr[3];
            eventSource = e.source;
            eventOrigin = e.origin;
            //GET PLAYER IFRAME
            if(playerFunc == "trigger" && playerMessage == "ready") {
                let pageFrames = document.getElementsByTagName("IFRAME");
                for (let i=0; i<pageFrames.length; i++) {
                    let f = pageFrames[i];
                    if (f.contentWindow == eventSource || 
                        f.contentWindow==eventSource.parent) {
                        playerIframe = f;
                        playerFrameWidth = f.style.width ? f.style.width : f.offsetWidth + "px";
                        playerFrameHeight = f.style.height ? f.style.height : (f.offsetHeight * 9 / 16 ) + "px"; //make it 16:9
                        iframeContainer = playerIframe.parentElement.parentElement;
                        iframeContainerChild = iframeContainer.firstElementChild;
                        break;
                    }
                }

				/***** SET ARTICLE OBSERVER START ****/
				article = document.querySelector('article');

				const articleOptions = {
				  root: null, // use the viewport
				  threshold: 0, // trigger as soon as even 1px is visible/hidden
				  rootMargin: "-200px 0px 0px 0px" // This is the trick!
				};

				articleObserver = new IntersectionObserver((entries) => {
				  entries.forEach(entry => {
				    // If isIntersecting is false and the bounding rect is negative, 
				    // it means the element is above the viewport (viewport is below the div).
				    if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
				      belowArticle = true
				      closeButton && unSticky();
				    } else {
				      //console.log("Viewport is ABOVE or INSIDE the article");
					  belowArticle = false
					  !inSticky && setSticky()
				    }
				  });
				}, articleOptions);
				
				articleObserver.observe(article);
				/***** SET ARTICLE OBSERVER END ****/

				/***** SET HEADER OBSERVER START ****/
				headerTag = document.querySelector('header');

				intersectionObserverHeader = new IntersectionObserver((entries) => {
					if( !entries[0].isIntersecting ) {
						headerInView = false;
						setSticky();
			        } else {
			            //closeButton && unSticky();
						headerInView = true;
						closeButton && unSticky();
			        }
				}, {threshold: 0.0});
                intersectionObserverHeader.observe(headerTag);
				/***** SET HEADER OBSERVER END ****/

                intersectionObserver = new IntersectionObserver(handleIntersection, {threshold: 1.0});
                intersectionObserver.observe(iframeContainer);

                eventSource.postMessage('BPLR|setUID', eventOrigin);

                setPlaybackTimeout();
            }


            if(playerFunc == "trigger" && playerMessage == "firstPlay") {
                clearPlaybackTimeout();
            }

            if(playerFunc == "findTextContainingTags") {
                matchingResult = findTextContainingTags(JSON.parse(playerMessage));
                eventSource.postMessage('TVVM|'+JSON.stringify(matchingResult), eventOrigin);
            }
        }
    }

    function setPlaybackTimeout() {
        playbackTimeout = setTimeout(function execeuteTiemout() {
            eventSource.postMessage('BPLR|autoplay|true', eventOrigin);
            eventSource.postMessage('BPLR|muted|true', eventOrigin);
            eventSource.postMessage('BPLR|play' , eventOrigin);
        }, 5000); 
    } 

    function clearPlaybackTimeout() {
        clearTimeout(playbackTimeout);
        playbackTimeout = null;
    }

    function handleIntersection(entries) {
		if( belowArticle ) {
			return false;
		}
        if( !entries[0].isIntersecting ) {
            setSticky( entries[0].boundingClientRect.top < 0  );
        } else {
            closeButton && unSticky();
        }
    }

    function unSticky() {
		inSticky = false;
        iframeContainerChild.style.position = "";
        iframeContainerChild.style.top = "";
        //iframeContainerChild.style.bottom = "";
        //iframeContainerChild.style.left = "";
        iframeContainerChild.style.padding = "";
        iframeContainerChild.style.zIndex = null;
        iframeContainerChild.style.width = "";
        iframeContainerChild.style.height = "";

        //playerIframe.style.width = playerFrameWidth;
        //playerIframe.style.height = playerFrameHeight;
        //playerIframe.style.float = "";

        //iframeContainerChild.removeChild(infoDiv);
        iframeContainerChild.removeChild( closeButton );

        eventSource.postMessage('BPLR|setUIDSticky|false' , eventOrigin);
    }

    function setSticky( isTop ) {
		if( belowArticle || headerInView ) {
			return false;
		}
		inSticky = true;
        var stickyWidth = iframeContainerChild.offsetWidth + "px";
        var stickyHeight = iframeContainerChild.offsetHeight + "px";
        //console.log("IS TOP", isTop);
        iframeContainerChild.style.position = "fixed";
        iframeContainerChild.style.zIndex = 20000;
        iframeContainerChild.style.top = "0px";
        //iframeContainerChild.style.left = "0px";
        iframeContainerChild.style.padding = "0px";
        iframeContainerChild.style.width = stickyWidth;
        iframeContainerChild.style.height = stickyHeight;

        //playerIframe.style.width = (document.body.offsetWidth/2) + "px";
        //playerIframe.style.width = document.body.offsetWidth + "px";
        //playerIframe.style.height = stickyHeight;
        //playerIframe.style.float = "left";

        if(!closeButton) {
            createCloseButton();
        }
        //iframeContainerChild.appendChild(infoDiv);
        iframeContainerChild.appendChild(closeButton);

        eventSource.postMessage('BPLR|setUIDSticky|true' , eventOrigin);
    }

    function createCloseButton() {

        closeButton = document.createElement('div');
        closeButton.innerHTML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16.6 17"><polygon fill="#FFF" points="15.5,1.7 13.7,0 7.7,6.1 1.8,0 0,1.7 6,7.9 0,14.1 1.8,15.9 7.7,9.7 13.7,15.9 15.5,14.1 9.5,7.9 "></polygon></svg>';
        closeButton.style.position = 'absolute';
        closeButton.style.top = closeButton.style.right = '3px';
        closeButton.style.width = closeButton.style.height = '13px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = 2;

        closeButton.addEventListener("click", closeSticky, false);
        
    }

    function closeSticky() {
        intersectionObserver.unobserve(iframeContainer);
		articleObserver.unobserve(article);
		intersectionObserverHeader.unobserve(headerTag);
		
        unSticky();
    }

    function findTextContainingTags(pageDetails) {
        var matchingResult = {success: false, text: ''};
        for ( var pageDetailsIndex = 0; pageDetailsIndex < pageDetails.length; pageDetailsIndex++ ) {
            var pageDetail = pageDetails[pageDetailsIndex];
			var htmlTags = document.querySelectorAll(pageDetail.elementTag);

            for ( var htmlTagsIndex = 0; htmlTagsIndex < htmlTags.length; htmlTagsIndex++ ) {

                if ( pageDetail.elementSelectorType ) {
                    if ( !pageDetail.elementSelector ) {
                        console.warn('findTextContainingTags : elementSelector property missing!', pageDetail); continue;
                    }

                    var attributeValue = htmlTags[htmlTagsIndex].getAttribute(pageDetail.elementSelectorType);

                    if ( !attributeValue || attributeValue.indexOf(pageDetail.elementSelector) === -1 ) {
                        continue;
                    }
                }

                if ( pageDetail.elementSub ) {
                    var subElements = htmlTags[htmlTagsIndex].querySelectorAll(pageDetail.elementSub);

                    for ( var subElementsIndex = 0; subElementsIndex < subElements.length; subElementsIndex++ ) {
                        var subElement = subElements[subElementsIndex];
                        /**
                         * Skip sub elements that are not visible, or the ones that do NOT contain any text.
                         */
                        if ( !subElement.innerText ) {
                            console.warn('findTextContainingTags : Skipping sub element (.innerText was falsy) : ', subElement); continue;
                        }

                        if ( !isHtmlElementVisible(subElement) ) {
                            console.warn('findTextContainingTags : Skipping sub element (display property was "none") : ', subElement); continue;
                        }

                        var normalizedText = normalizeText(subElement.innerText);

                        if ( normalizedText ) {
                            matchingResult.text += normalizedText + (pageDetail.addDot ? '.' : '');
                        }
                    }
                } else {
                    var normalizedText = normalizeText(htmlTags[htmlTagsIndex].innerText);

                    if ( normalizedText ) {
                        matchingResult.text += normalizedText + (pageDetail.addDot ? '.' : '');
                    }
                }
            }
        }

        if(matchingResult.text) {
            matchingResult.success = true;
        } 

        return matchingResult;
    }

    function normalizeText(string) {
        try {
			if ( !string || typeof string !== 'string' ) {
				throw new Error('Not a string');
			}

			string = string.trim();
			/**
			 * Replace this special characters with ASCII equivalents.
			 * Taken from here : https://www.freeformatter.com/html-entities.html.
			 */
			var integerEntities = {
				// ˆ - Circumflex accent.
				"ˆ" : "^",
				// ˜ - Tilde.
				"˜" : "~",
				// – - En dash.
				"–" : '-',
				// — - Em dash.
				"—" : '-',
				// ‘ - Left single quotation mark.
				"‘" : "'",
				// ’ - Right single quotation mark.
				"’" : "'",
				// ‚ - Single low-9 quotation mark.
				"‚" : ",",
				// “ - Left double quotation mark.
				"“" : "\"",
				// ” - Right double quotation mark.
				"”" : "\"",
				// „ - Double low-9 quotation mark.
				"„" : ","
			};

			for ( var entity in integerEntities ) {
				if ( integerEntities.hasOwnProperty(entity) ) {
					string = string.replaceAll(entity, integerEntities[entity]);
				}
			}

			return string;
		} catch(error) {
			console.warn('Video Matching normalizeText : ', error);
			console.warn('Video Matching normalizeText string : ', string);

			return '';
		}
    }

    function isHtmlElementVisible(elem) {
		return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
	}

})()
