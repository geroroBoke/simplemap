// makrer.js 	マーカーに関係するコードが長ったらしいので切り出してみた

// --------------------------------------------------------------------
//	createMarker
// --------------------------------------------------------------------
// GeoHandleのchacheResultに基づいてマーカーを作成する
function createMarker(id, result, dataRow, isFocused){

	// richMarkerのプロパティ
	var latlng = result.latlng;
	// 吹き出しの中身
	var labelInitial = dataRow[myGroupBy].match(/[^\d:;#]/);// 数字や記号以外で最初の一文字を取得する
	var labelNumber = dataRow[mySortBy].match(/[\d]+/); // 連続した数字を取得する
	var labelText = "";
	if ( labelInitial ) labelText += labelInitial;
	if ( labelNumber ) labelText += labelNumber;

	// 吹き出しの色を取得
	var colorText = getTantouCssColorText(dataRow[myGroupBy]);

	// 横のコメントの内容
	var commentText = result.address;

	// richmarkerのcontentの作成
	var $contentDiv = $('<div>')
		.attr('id', id)
		.attr('title', commentText)
		.append(
			$('<div>')
				.addClass('marker')
				.css({'background-color' : colorText,'border-top-color':	colorText})
				.text(labelText)
			,$('<div>')
				.addClass('markerComment')
				.addClass((isFocused)? 'markerFocused':'')
				.text(commentText)
		);

		// richMarkerを作成
	var marker = new RichMarker({
		position: latlng,
		map: myMap,
		flat: true,		//true推奨
		content: $contentDiv[0].outerHTML,
	});

	// クリック時にInfoWindowを作成
	marker.addListener('click', function(e){
		var info = createInfoWindow(dataRow);
		info.open(myMap, marker);
	});

	// 作成したマーカーを返す
	return marker;
}

// InfoWindowを作成
function createInfoWindow(dataRow){
	// 中身の作成
	var content ='<div class="infoWindow">';
	Object.keys(dataRow).forEach(function(k){
		content += k + ':' + dataRow[k] + '<br>';
	});
	content += '</div>';

	// infowindowの作成
	var info = new google.maps.InfoWindow({
		maxWidth:250,
		pixelOffset:{height:-15, width:0},
		content:content,
	});
	// InfoWindowを返す
	return info;
}

// --------------------------------------------------------------------
//	refleshMarker
// --------------------------------------------------------------------
// マーカーを再描画する
function refleshMarker(){

	//	データの担当者一つ一つに対して　TODO
	myData.data.forEach(function(dataRow, id){

		// 担当者のスパンがmarked, focusedフラグの取得
		var isMarked = isTantouSpanClassed(dataRow[myGroupBy], 'marked') ;
		var isFocused = isTantouSpanClassed(dataRow[myGroupBy], 'focused');

		// 要マーカー作成
		if ( isMarked || isFocused){
			// マーカー作成
			if (!myMarkerArr[id]){
				//ジオコーダ取得。
				var result = GeoHandle.cacheResult[dataRow[myPlotBy]];

				//検索履歴なしもしくは取得失敗なら終了
				if (!result || result.address == GeoHandle.TEXT_FAILED) return;

				// マーカー作成
				myMarkerArr[id] = createMarker(id, result, dataRow, isFocused);
			}
		}else{
			// マーカーの削除
			if(myMarkerArr[id]) myMarkerArr[id].setMap(null);
			myMarkerArr[id] = null;
		}

		// フォーカス時 マーカーのコメント部分にfocusedクラスを付加する
		if ( isFocused ){
			$('#'+id + '>.markerComment').addClass('markerFocused');
		}else{
			$('#'+id + '>.markerComment').removeClass('markerFocused');
		}
});
}
