
// global variants
var myData;
var myTitle;
var myGroupBy;
var mySortBy;
var myPlotBy;
var myMarkerArr;
var myBounds;
var myMap;

$(function(){
	main();
});

// --------------------------------------------------------------------
//	main
// --------------------------------------------------------------------
function main(){
	// トグルスイッチ
	$('#toggleDataBtn').click(toggleDataDiv);
	$('#toggleSearchBtn').click(toggleSearchDiv);
	$('#toggleTantouBtn').click(toggleTantouDiv);
	$('#toggleShareBtn').click(toggleShareDiv);

	setDataDivEvents(); // 取り込みボタン
	setSearchDivEvents();// 検索ボタン
	setSlideDivEvents();// 切替スライド

	// initialze global variants
	initGlobalVariants();

	// geocoderキャッシュ管理オブジェクトを初期化
	GeoHandle.init(true);

	// URIに#以降があればそのパラメータでimportDataを行う
	if (location.hash.length >= 0){
		importData(decodeURI(location.hash.substring(1)),
		true, true ,true);// default true true
	}
}

// initialze global variants
function initGlobalVariants(){
	// データ本体 ObjectArray importData内で初期化
	 myData = null;

	// オプション用の変数を用意 デフォルトを設定 importData内で再設定
	 myTitle = getDefaultParseOption('title');
	 myGroupBy = getDefaultParseOption('groupby');
	 mySortBy = getDefaultParseOption('sortby');
	 myPlotBy = getDefaultParseOption('plotby');

	// マーカー配列を用意
	 myMarkerArr = [];

	// マップの表示領域を格納する
	 myBounds = new google.maps.LatLngBounds();

	// googleマップの読込み
	 myMap = new google.maps.Map($('#map')[0], getMyMapOption());
}

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

	var commentText = result.address; // 横のコメントの内容

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
	var content ='<div class="infoDiv">';
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
// --------------------------------------------------------------------
//	parseOption
// --------------------------------------------------------------------
function retriveParseOption(srcText, getField){
	var result = '';
	// 行ごとに分解
	srcText.split('\n').forEach(function(line){
		// #で始まる行は制御文
		if (line.substr(0,1) == '#'){
			var param = line.substr(1).split(':');
			// :以前が該当フィールドなら:以後をリターン
			if (param[0] == getField ) result =	param[1];
		}
	});
	return result;
}

function getDefaultParseOption(getField){
	if (getField == 'title') return 'かんたん地図プロット';
	if (getField == 'groupby') return '担当者';
	if (getField == 'sortby') return '訪問順';
	if (getField == 'plotby') return '住所';
}

function outputParseOptionText(){
	var tempText = '';
	tempText += '#title:' + myTitle + '\n';
	tempText += '#groupby:' + myGroupBy + '\n';
	tempText += '#sortby:' + mySortBy + '\n';
	tempText += '#plotby:' + myPlotBy + '\n';
	return tempText;
}


// ソースからパース設定に関する行を取り除く
function trimParseOptions(srcText){
	var newText ='';
	srcText.split('\n').forEach(function(line){
			// #で始まる行は制御文 取り除く
			if (line.substr(0,1) != '#') newText += line + '\n';
	});
	return newText;
}

// myDataをURIエンコードされた文字列として返す
// TODO arrFilters プロパティで絞り込む
function exportData(){
	var csvtext = dataHandle.csvOutput(myData.data, '\t');
	if (!csvtext) {
		// error
		return;
	}
	return encodeURI(csvtext);
}


// --------------------------------------------------------------------
//	importData
// --------------------------------------------------------------------
// 渡されたテキストをパースして地図プロットする
function importData(dataText, isUniqueRecord, isTrimGarbage, isTrimMansion, isReset){

	// テキストが空なら終了
	if (!dataText) return;

	// #制御文からパース設定を取得する
	if (retriveParseOption(dataText, 'title')) myTitle = retriveParseOption(dataText, 'title');
	if (retriveParseOption(dataText, 'groupby')) myGroupBy = retriveParseOption(dataText, 'groupby');
	if (retriveParseOption(dataText, 'sortby')) mySortBy = retriveParseOption(dataText, 'sortby');
	if (retriveParseOption(dataText, 'plotby')) myPlotBy = retriveParseOption(dataText, 'plotby');
	dataText = trimParseOptions(dataText);// ソースからパース設定に関する行を取り除く

	// テキストをパースする
	var data = dataHandle.csvParse(dataText, '\t', true);

	// パースできていなければ終了
	if (!data) return;

	// データ上に指定フィールドが無ければ、フィールド再選択ダイアログボックスを起動して、再起動
	if ( isReset
		|| data.getList(myPlotBy)[0] == undefined
		|| data.getList(myGroupBy)[0] == undefined
		||	data.getList(mySortBy)[0] == undefined ){
			getMyParseOptionsByDialog(data, function(){
				importData(dataText, isUniqueRecord, isTrimGarbage, isTrimMansion);
			});
			return;
	}

	// フィールド名と等しい値がある行は削除する
	data.data = data.data.filter(function(row){
		if (row[myPlotBy] ===myPlotBy) return false;
		if (row[myGroupBy]===myGroupBy) return false;
		if (row[mySortBy]===mySortBy) return false;
		return true;
	});

	// 重複したレコードがあれば削除する
	if (isUniqueRecord){data.data = getUniqueRecordArray(data.data)};

	// Trimフラグがあれば行う
	if (isTrimGarbage){data.data.forEach(function(row){row[myPlotBy] = trimGarbage(row[myPlotBy]);});}
	if (isTrimMansion){data.data.forEach(function(row){row[myPlotBy] = trimMansionOrlater(trimGarbage(row[myPlotBy]));});}

	// dataをプロット用のデータとして採用する
	myData = data;

	// 新しいデータでマップの初期化をしなおす
	initializeMap();
}

// ダイアログボックスからparseOptionを取得する
function getMyParseOptionsByDialog(data, onFinish){

	// doNextActionで実行する関数一覧
	var arrFunc = [
		getPlotByOption,
		getGroupByOption,
		getSortByOption
	];
	var idFunc = 0;

	// 最初の関数を実行
	doNextAction();

	// OKを押されるたびに次の関数を実行する
	function doNextAction(){
		if (idFunc < arrFunc.length ) {
			arrFunc[idFunc++]();
		} else{
			// 終了指定アクション
			onFinish();
		}
	}

	function getPlotByOption(){
		setDialogDiv(
			'『住所』フィールドの選択',
			'マーカーの座標を示す住所などが格納されているフィールドを選択してください',
			Object.keys(data.data[0]),
			function(option){
				myPlotBy = option;
				doNextAction();
			},
			myPlotBy
		);
	}
	function getGroupByOption(){
		setDialogDiv(
			'『グループ』フィールドの選択',
			'マーカーの色分けの基準とするフィールドを選択してください',
			Object.keys(data.data[0]),
			function(option){
				myGroupBy = option;
				doNextAction();
			},
			myGroupBy
		);
	}

	function getSortByOption(){
		setDialogDiv(
			'『順番』フィールドの選択',
			'並べ替えの基準とするフィールドを選択してください',
			Object.keys(data.data[0]),
			function(option){
				mySortBy = option;
				doNextAction();
			},
			mySortBy
		);
	}
}

// --------------------------------------------------------------------
//	initializeMap
// --------------------------------------------------------------------
// 担当者ボックスを初期化する、マーカーを初期化する
function initializeMap(){

	// データがなければ終了
	if (!myData) return;

	// タイトルの設定
	document.title = myTitle;

	// 全マーカの削除
	for (var i = 0; i < myMarkerArr.length ; i++){
		if (myMarkerArr[i]) myMarkerArr[i].setMap(null);
	}
	myMarkerArr = [];

	// 地図の表示範囲初期化
	myBounds = null;

	// 担当者ボックスの初期化
	setTantouDiv();

	// グループ切り替えセレクトDIVを初期化
	setSwitchDiv();

	// GeoHandleオブジェクトの操作
	GeoHandle.onLocate = myCallBack; //マーカーの再描画
	GeoHandle.addAddress(myData.getList(myPlotBy, true));//住所を重複なしのリストにして追加する
}

// アイテムが取得される度に呼ばれる(geocoderResult)
function myCallBack(request, result){
	// マーカーを再描画
	refleshMarker();

	//
	var buffer = '';
	buffer += request + 'を検索 ';
	if (GeoHandle.listAddress.length) buffer += '（残り' + (GeoHandle.listAddress.length)	+ '件）';
	setStatusText(buffer, 2000);

}

function getMyMapOption(){
	var mapCenter = {lat:35.5, lng:139.6};
	var	mapzoom = 14;
	return {
		center:mapCenter,
		zoom:mapzoom,
		mapTypeControl:false,
		streetViewControl:false,
		streetViewControlOptions:{
			position: google.maps.ControlPosition.RIGHT_TOP,
		},
		zoomControl:false,
		zoomControlOptions:{
			position: google.maps.ControlPosition.RIGHT_CENTER,
			style:google.maps.ZoomControlStyle.LARGE
		},
		scaleControl: true,
		scaleControlOptions: {
		position: google.maps.ControlPosition.BOTTOM_LEFT
		},
	};
}
