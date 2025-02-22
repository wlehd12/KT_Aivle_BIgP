document.addEventListener("DOMContentLoaded", function() {
    var searchButton = document.getElementById('search-button');
    var nameInput = document.getElementById('booth-name-input');
    var modal = document.getElementById("myModal");
    var closeButton = document.getElementsByClassName("close");
    var modalImage = document.getElementById("modalImage");
    var modalText0 = document.getElementById("modalText0");
    var modalText1 = document.getElementById("modalText1");
    var modalText2 = document.getElementById("modalText2");
    var suggestionsDiv = document.getElementById('suggestions');
    var categorySelect = document.querySelector('select[name="category"]');
    var rectangles = document.querySelectorAll('.rectangle');
    var selectedCategory = '전체';
    var bookmarkModal = document.getElementById("bookmarkModal");
    const reservationButton = document.getElementById('reservation');
    const showFormButton = document.getElementById('show-form-button');
    const routeForm = document.getElementById('route-form');
    
    

    function populateCategories() {
        var categories = ['전체'];
        booths.forEach(function(booth) {
            var category = booth.fields.booth_category;
            if (!categories.includes(category)) {
                categories.push(category);
                var option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            }
        });

        var allOption = document.createElement('option');
        allOption.value = '전체';
        allOption.textContent = '전체';
        categorySelect.insertBefore(allOption, categorySelect.firstChild);
    }

    function filterRectangles(category) {
        rectangles.forEach(function(rectangle, index) {
            var booth = booths[index];
            if (booth && (category === '전체' || booth.fields.booth_category === category)) {
                rectangle.style.display = 'block';
            } else {
                rectangle.style.display = 'none';
            }
        });
    }

    function handleInput() {
        const userText = nameInput.value.trim().toLowerCase();
        suggestionsDiv.innerHTML = '';

        const filteredBooths = booths.filter(booth => {
            return (selectedCategory === '전체' || booth.fields.booth_category === selectedCategory) &&
                   booth.fields.booth_name.toLowerCase().includes(userText);
        });

        filteredBooths.forEach((booth, index) => {
            const suggestion = document.createElement('div');
            suggestion.classList.add('suggestion');
            suggestion.textContent = booth.fields.booth_name;
            suggestion.style.top = `${index * 40}px`;
            suggestion.addEventListener('click', function() {
                nameInput.value = booth.fields.booth_name;
                suggestionsDiv.innerHTML = '';
            });
            suggestionsDiv.appendChild(suggestion);
        });

        nameInput.addEventListener('click', function() {
            suggestionsDiv.style.display = 'block';
        });

        document.addEventListener('click', function(event) {
            if (!nameInput.contains(event.target)) {
                suggestionsDiv.style.display = 'none';
            }
        });
    }

    categorySelect.addEventListener('change', function() {
        selectedCategory = categorySelect.value.trim();
        filterRectangles(selectedCategory);
        handleInput();
    });

    populateCategories();
    categorySelect.selectedIndex = 0;
    filterRectangles(selectedCategory);
    nameInput.addEventListener('input', handleInput);

    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const userText = nameInput.value.trim().toLowerCase();
            let found = false;

            for (let i = 0; i < booths.length; i++) {
                if (userText === booths[i].fields.booth_name.toLowerCase()) {
                    found = true;
                    const detectRect = document.querySelector(`.rectangle[data-index='${i}']`);
                    if (detectRect) {
                        detectRect.classList.add('blink');
                        setTimeout(() => detectRect.classList.remove('blink'), 5000);
                        detectRect.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    break;
                }
            }
            if (!found) {
                alert("검색어에 맞는 부스가 없습니다.");
            }
        });
    }

    function checkImageExists(url, callback) {
        var img = new Image();
        img.onload = function() { callback(true); };
        img.onerror = function() { callback(false); };
        img.src = url;
    }

    //창 생성
    function showModal(rectIndex) {
        const booth = booths[rectIndex];
        const boothId = booth.pk;
        const companyName = booth.fields.company_name;
        var result = booth.fields.company_name.slice(5, 8).replace(/[^0-9]/g, "");
        var formattedIndex = result.toString().padStart(2, '0');
        var imageName = booth.fields.company_name[0] + "_" + booth.fields.company_name.slice(3,5) + "_" + formattedIndex;

        var jpgImageName = imageName + ".jpg";
        var pngImageName = imageName + ".png";

        checkImageExists(imageBasePath + jpgImageName, function(exists) {
            if (exists) {
                modalImage.src = imageBasePath + jpgImageName;
            } else {
                checkImageExists(imageBasePath + pngImageName, function(exists) {
                    if (exists) {
                        modalImage.src = imageBasePath + pngImageName;
                    } else {
                        console.error('No image found for booth:', booth.booth_name);
                    }
                });
            }
        });

        modalText0.innerHTML = booth.fields.company_name;
        // 부스명, 기업명, BM
        modalText1.innerHTML ='<span class="modaltitle">' + booth.fields.booth_name + '</span>' +
                       '<br>' + booth.fields.booth_category;
                              
        // 설명
        modalText2.innerHTML = '<div>' +
                                '<span class="modaltitle">설명/서비스: </span>' +
                                '<br> - ' + booth.fields.background +
                                '<br> - ' + booth.fields.service +
                                '</div>';
        modal.style.display = "block";

        reservationButton.dataset.reservationUrl = `/booth_program/reserve/${boothId}/`;

        reservationButton.removeEventListener('click', handleReservation);
        reservationButton.addEventListener('click', handleReservation);
               // 북마크 버튼 클릭 시 처리
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];             
        const bookmarkBtn = document.getElementById('bookmark-btn');
        bookmarkBtn.innerHTML = bookmarks.includes(boothId) ? '<i class="fa-solid fa-star fa-2x" style="color: #FFD43B;"> </i>' : '<i class="fa-regular fa-star fa-2x"> </i>';

        bookmarkBtn.addEventListener('click', function() {
            if (bookmarks.includes(boothId)) {
                // 북마크 취소
                bookmarks = bookmarks.filter(id => id !== boothId);
                bookmarkBtn.innerHTML = '<i class="fa-regular fa-star fa-2x"> </i>';
            } else {
                // 북마크 추가
                bookmarks.push(boothId);
                bookmarkBtn.innerHTML = '<i class="fa-solid fa-star fa-2x" style="color: #FFD43B;"> </i>';
            }
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));          
            updateBookmarkIcons();
        });
    }

    //예약기능
    function handleReservation(event) {
        event.preventDefault();
        const companyName = encodeURIComponent(modalText0.innerText);
        if (companyName) {
            fetch(`/booth_program/check_program/${companyName}/`)
                .then(response => response.json())
                .then(data => {
                    if (data.exists) {
                        const reservationUrl = reservationButton.dataset.reservationUrl;
                        window.location.href = reservationUrl;
                    } else {
                        alert("기업에서 프로그램을 생성하지 않았습니다.");
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        } else {
            console.error('No company name found');
        }
    }
    
    //북마크 업데이트
    function updateBookmarkIcons() {
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        rectangles.forEach(function(rectangle, index) {
            if (!booths[index] || !booths[index].fields) return;
            const boothId = booths[index].pk;
            const existingIcon = rectangle.querySelector('.bookmark-icon');
            if (bookmarks.includes(boothId)) {
                if (!existingIcon) {
                    const starIcon = document.createElement('i');
                    starIcon.className = 'fa-solid fa-star bookmark-icon';
                    starIcon.style = 'color: #FFD43B;';
                    rectangle.appendChild(starIcon);
                }
            } else {
                if (existingIcon) {
                    rectangle.removeChild(existingIcon);
                }
            }
        });
        populateBookmarkOptions();
    }

    //스크롤기능
    const imageContainer = document.querySelector('.image-container');
    if (imageContainer) {
        const img = imageContainer.querySelector('img');

        let lastScrollX = 0;
        let lastScrollY = 0;

        imageContainer.addEventListener('scroll', function(event) {
            const deltaX = imageContainer.scrollLeft - lastScrollX;
            const deltaY = imageContainer.scrollTop - lastScrollY;

            lastScrollX = imageContainer.scrollLeft;
            lastScrollY = imageContainer.scrollTop;

            img.style.left = `${parseFloat(img.style.left) - deltaX}px`;
            img.style.top = `${parseFloat(img.style.top) - deltaY}px`;
        });
    } else {
        console.error("Element with class 'image-container' not found.");
    }

    //북마크 리스트
    function updateBookmarkModal() {
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        if (bookmarks.length > 0) {
            let bookmarkNames = booths.filter(booth => bookmarks.includes(booth.pk)).map(booth => booth.fields.booth_name);
            let modalBody = document.getElementById('bookmarkList');
            modalBody.innerHTML = ''; // Clear previous content
            bookmarkNames.forEach(function(bookmark) {
                let li = document.createElement('li');
                
                // Create checkbox
                let checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = bookmark; // 체크박스의 값 설정 (북마크 이름)
                checkbox.style.marginRight = '10px'; // 체크박스와 텍스트 사이 간격 설정
                
                // 북마크 상태 복원
                let isChecked = JSON.parse(localStorage.getItem(bookmark)) || false;
                checkbox.checked = isChecked;
                
                // 체크박스에 change 이벤트 리스너 추가
                checkbox.addEventListener('change', function() {
                    localStorage.setItem(bookmark, checkbox.checked); // 상태 저장
                    updateTextDecoration(li, checkbox.checked); // 취소선 갱신
                });
                
                // 리스트 아이템에 북마크 이름 추가
                let label = document.createElement('label');
                label.textContent = bookmark;
                label.style.display = 'inline-block'; // 체크박스와 텍스트를 한 줄에 배치
                label.style.verticalAlign = 'middle'; // 세로 정렬
                label.style.textDecoration = isChecked ? 'line-through' : 'none'; // 초기 취소선 설정
                
                // 체크박스를 리스트 아이템에 추가
                li.appendChild(checkbox);
                li.appendChild(label);
                
                // 리스트 아이템을 modalBody에 추가
                modalBody.appendChild(li);
            });
    
            // Show modal
            bookmarkModal.style.display = 'block';
        } else {
            alert('북마크된 부스 없음.');
        }
    }
    
    // 텍스트에 취소선 스타일 적용/해제하는 함수
    function updateTextDecoration(element, isChecked) {
        if (isChecked) {
            element.querySelector('label').style.textDecoration = 'line-through';
        } else {
            element.querySelector('label').style.textDecoration = 'none';
        }
    }
    

    // Event listener for showing bookmarks in modal
    const showBookmarksButton = document.getElementById('show-bookmarks');
    if (showBookmarksButton) {
        showBookmarksButton.addEventListener('click', function() {
            updateBookmarkModal();
        });
    }

    // 북마크 리셋
    const resetButton = document.getElementById('reset-bookmarks');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            bookmarks = [];
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            alert('북마크 리셋.');
            updateBookmarkIcons();
            clearLines();
        });
    }
    
    //창 닫기 기능
    function closeModal() {
        modal.style.display = "none";
        bookmarkModal.style.display = "none";
    }

    document.querySelectorAll('.rectangle').forEach(function(rectangle, index) {
        rectangle.setAttribute('data-index', index);
        rectangle.addEventListener('click', function() {
            showModal(index);
        });
    });

    Array.from(closeButton).forEach(function(button) {
        button.addEventListener("click", closeModal);
    });

    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
        else if(event.target === bookmarkModal) {
            closeModal();
        }
    }

    updateBookmarkIcons();

    //경로 보이기 버튼
    if (showFormButton) { 
        showFormButton.addEventListener('click', function() {
            routeForm.classList.toggle('hidden');    
            if (routeForm.classList.contains('hidden')) {
                showFormButton.innerText = "경로 생성 툴 보이기(DEMO)"; // "Show Route Form"
            } else {
                showFormButton.innerText = "경로 생성 툴 숨기기(DEMO)"; // "Hide Route Form"
            }
        });
    }

    //경로 그리기
    const gridContainer = document.getElementById('grid-container');
    const processedImage = document.getElementById('processed-image');
    const rows = bwArray.length;
    const cols = bwArray[0].length;
    const imgWidth = processedImage.clientWidth;
    const imgHeight = processedImage.clientHeight;
    const cellWidth = imgWidth / cols;
    const cellHeight = imgHeight / rows;

    function clearLines() {
        gridContainer.innerHTML = '';  // Clear existing content
    }

    function createGrid(cols, rows, cellWidth, cellHeight) {
        gridContainer.innerHTML = '';  // Clear existing content
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellWidth}px)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, ${cellHeight}px)`;
        gridContainer.style.width = `${cols * cellWidth}px`;
        gridContainer.style.height = `${rows * cellHeight}px`;
    
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                // if (bwArray[i][j] === 0) {
                //     cell.style.backgroundColor = 'black';
                // }
                gridContainer.appendChild(cell);
            }
        }
    }

    function drawLinesBetweenBooths() {
        const startBoothId = document.getElementById('start_booth').value.trim();
        const endBoothId = document.getElementById('end_booth').value.trim();
    
        if (startBoothId === endBoothId) {
            alert('같은 부스를 선택하실 수 없습니다.');
            return;
        }
    
        clearLines();
    
        let cnt = 1;
        if (startBoothId > 165) {
            cnt = 166;
        } else if (startBoothId > 87) {
            cnt = 88;
        } else if (startBoothId > 37) {
            cnt = 38;
        }
    
        const rows = bwArray.length;
        const cols = bwArray[0].length;
    
        createGrid(cols, rows, cellWidth, cellHeight);  // Ensure consistent cell dimensions

        const graph = new Graph(bwArray);
        const startBooth = document.querySelector(`.rectangle[data-index='${startBoothId - cnt}']`);
        const endBooth = document.querySelector(`.rectangle[data-index='${endBoothId - cnt}']`);
    
        const boothWidth = parseFloat(startBooth.style.width);
        const boothHeight = parseFloat(startBooth.style.height);
    
        let startX = parseFloat(startBooth.dataset.centerX);
        let startY = parseFloat(startBooth.dataset.centerY);
        let endX = parseFloat(endBooth.dataset.centerX);
        let endY = parseFloat(endBooth.dataset.centerY);
    
        const buffer = 15;
    
        if (bwArray[Math.round(startY / cellHeight)][Math.round(startX / cellWidth)] === 1) {
            startX = startX > boothWidth / 2 ? startX - boothWidth / 2 - buffer : startX + boothWidth / 2 + buffer;
            startY = startY > boothHeight / 2 ? startY - boothHeight / 2 - buffer : startY + boothHeight / 2 + buffer;
        }
    
        if (bwArray[Math.round(endY / cellHeight)][Math.round(endX / cellWidth)] === 1) {
            endX = endX > boothWidth / 2 ? endX - boothWidth / 2 - buffer : endX + boothWidth / 2 + buffer;
            endY = endY > boothHeight / 2 ? endY - boothHeight / 2 - buffer : endY + boothHeight / 2 + buffer;
        }
    
        const startNodeX = Math.round(startX / cellWidth);
        const startNodeY = Math.round(startY / cellHeight);
        const endNodeX = Math.round(endX / cellWidth);
        const endNodeY = Math.round(endY / cellHeight);
    
        const startNode = graph.grid[startNodeX][startNodeY];
        const endNode = graph.grid[endNodeX][endNodeY];
    
        console.log('Start Node:', startNode);
        console.log('End Node:', endNode);
    
        const result = astar.search(graph, startNode, endNode);
    
        if (result.length === 0) {
            alert('경로를 찾을 수 없습니다.');
            return;
        }
    
        result.forEach(node => {
            const cellIndex = node.y * cols + node.x;
            const cell = gridContainer.children[cellIndex];
            if (cell) {
                cell.classList.add('path');
            }
        });
    
        startBooth.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    
    //북마크 옵션 생성
    function populateBookmarkOptions() {
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

        const startbookmarkSelect = document.getElementById('start_booth');
        const endbookmarkSelect = document.getElementById('end_booth');
        startbookmarkSelect.innerHTML = ''; // Clear previous options
        endbookmarkSelect.innerHTML = ''; // Clear previous options

        // Create an option for each bookmarked booth
        bookmarks.forEach(boothId => {
            const booth = booths.find(b => b.pk === boothId);
            if (booth) {
                const optionStart = document.createElement('option');
                const optionEnd = document.createElement('option');
                optionStart.value = booth.pk;
                optionStart.textContent = booth.fields.booth_name; // Adjust as per your booth data
                optionEnd.value = booth.pk;
                optionEnd.textContent = booth.fields.booth_name; // Adjust as per your booth data
                startbookmarkSelect.appendChild(optionStart);
                endbookmarkSelect.appendChild(optionEnd);
            }
        });
    }
    
    const drawLineButton = document.getElementById('draw-line-button');
    const eraseLineButton = document.getElementById('erase-route');

    if (drawLineButton) {
        drawLineButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent form submission if inside a form
            drawLinesBetweenBooths();

            console.log('draw line!')
        });
    }
    if (eraseLineButton) {
        eraseLineButton.addEventListener('click', function() {     
            clearLines();
        });
    }
});
