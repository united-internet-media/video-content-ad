(function() {
    var playerIframe, iframeContainer, iframeContainerChild, playbackTimeout,
    intersectionObserver, eventSource, eventOrigin, closeButton, currentVideoTitle,
    playerFrameWidth, playerFrameHeight = null;
    window.addEventListener("message", messageHandler, false);
    function messageHandler(e) {
        var messageArr, playerFunc, playerMessage = null;
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

                intersectionObserver = new IntersectionObserver(handleIntersection, {threshold: 1.0});
                intersectionObserver.observe(iframeContainer);

                eventSource.postMessage('BPLR|setUID', eventOrigin);

                setPlaybackTimeout();
            }


            if(playerFunc == "trigger" && playerMessage == "firstPlay") {
                clearPlaybackTimeout();
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
        if( !entries[0].isIntersecting ) {
            setSticky( entries[0].boundingClientRect.top < 0  );
        } else {
            closeButton && unSticky();
        }
    }

    function unSticky() {
        iframeContainerChild.style.position = "";
        iframeContainerChild.style.top = "";
        //iframeContainerChild.style.bottom = "";
        iframeContainerChild.style.left = "";
        iframeContainerChild.style.padding = "";
        iframeContainerChild.style.zIndex = null;
        iframeContainerChild.style.width = "";
        iframeContainerChild.style.height = "";

        playerIframe.style.width = playerFrameWidth;
        playerIframe.style.height = playerFrameHeight;
        playerIframe.style.float = "";

        //iframeContainerChild.removeChild(infoDiv);
        iframeContainerChild.removeChild( closeButton );

        eventSource.postMessage('BPLR|setUIDSticky|false' , eventOrigin);
    }

    function setSticky( isTop ) {
        var stickyWidth = document.body.offsetWidth + "px";
        var stickyHeight = ((document.body.offsetWidth/2)*9/16) + "px";
        //console.log("IS TOP", isTop);
        iframeContainerChild.style.position = "fixed";
        iframeContainerChild.style.zIndex = 20000;
        iframeContainerChild.style.top = "50px";
        iframeContainerChild.style.left = "0px";
        iframeContainerChild.style.padding = "0px";
        iframeContainerChild.style.width = stickyWidth;
        iframeContainerChild.style.height = stickyHeight;

        //playerIframe.style.width = (document.body.offsetWidth/2) + "px";
        playerIframe.style.width = document.body.offsetWidth + "px";
        playerIframe.style.height = stickyHeight;
        playerIframe.style.float = "left";

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

        unSticky();
    }

})()
