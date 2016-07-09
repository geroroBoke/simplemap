// simpleplot.js 初期化に関するコードはここ

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

	$('#toggleMenuBtn').click(toggleMenuDiv);
	$('#toggleDataBtn').click(toggleDataDiv);
	$('#toggleSearchBtn').click(toggleSearchDiv);
	$('#toggleTantouBtn').click(toggleTantouDiv);
	$('#toggleShareBtn').click(toggleShareDiv);
	$('#toggleAboutBtn').click(toggleAboutDiv);

	setDataDivEvents(); // 取り込みボタン
	setSearchDivEvents();// 検索ボタン
	setSlideDivEvents();// 切替スライド

	// initialze global variants
	initGlobalVariants();

	// geocoderキャッシュ管理オブジェクトを初期化
	GeoHandle.init(true);

	// URIに#以降があればそのパラメータでimportDataを行う
	if (location.hash.length >= 0){
		var dataText = decodeURI(location.hash.substring(1));
		var option = {
			isUniqueRecord : true ,
			isTrimGarbage : true,
			isTrimMansion : true,
			isReset: false,
		}
		importData(dataText, option);// default true true
	}
}
// --------------------------------------------------------------------
// initGlobalVariants
// --------------------------------------------------------------------
//initialze global variants
function initGlobalVariants(){
	// データ本体を初期化
	 myData = null;

	 // デフォルトのPartseOption値を取得する
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
//	parseOption
// --------------------------------------------------------------------

// デフォルトのPartseOption値を取得する
function getDefaultParseOption(getField){
	if (getField == 'title') return 'かんたん地図プロット';
	if (getField == 'groupby') return '担当者';
	if (getField == 'sortby') return '訪問順';
	if (getField == 'plotby') return '住所';
}

// #制御文から各パース設定を取得する
function retriveParseOptions(){
	if (retriveParseOption(dataText, 'title')) myTitle = retriveParseOption(dataText, 'title');
	if (retriveParseOption(dataText, 'groupby')) myGroupBy = retriveParseOption(dataText, 'groupby');
	if (retriveParseOption(dataText, 'sortby')) mySortBy = retriveParseOption(dataText, 'sortby');
	if (retriveParseOption(dataText, 'plotby')) myPlotBy = retriveParseOption(dataText, 'plotby');
}

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
// データ上にプロットに必要なフィールドが全て揃っているか？
function isAllParseOptionsOnField(data){

	if (!data.getList(myPlotBy)[0]) return false;
	if (!data.getList(mySortBy)[0]) return false;
	if (!data.getList(myGroupBy)[0]) return false;

	return true;
}

// --------------------------------------------------------------------
//	exportData
// --------------------------------------------------------------------
// 指定されたObjectArrayをURIエンコードされた文字列として返す
function exportData(data){
	if (!data) return;

	var csvtext = data.csvOutput('\t');
	if (!csvtext) return;
	return encodeURI(csvtext);
}

// --------------------------------------------------------------------
//	importData
// --------------------------------------------------------------------
// 渡されたテキストをパースして地図プロットする
// importOptions
	// isUniqueRecord : importOptions.isUniqueRecord ,
	// isTrimGarbage : importOptions.isTrimGarbage,
	// isTrimMansion : importOptions.isTrimMansion,
	// isReset: importOptions.isReset,

function importData(dataText, importOptions){

	// テキストが空なら終了
	if (!dataText) return;

	// #制御文からパース設定を取得する
	retriveParseOptions();

	// ソースからパース設定に関する行を取り除く
	dataText = trimParseOptions(dataText);

	// テキストをObjectArrayにパースする
	var data = dataHandle.ObjectArray.csvParse(dataText, '\t');

	// パースできていなければ終了
	if (!data) return;

	// リセットフラグがある、データ上に指定フィールドが無ければ、
	// フィールド再選択ダイアログボックスを起動して、importDataをやり直す
	if ( importOptions.isReset || !isAllParseOptionsOnField){
			getMyParseOptionsByDialog(data, function(){
				// importDataをやり直す
				importData(dataText, importOptions);
			});
			return; // 本プロセスは終了
	}

	// フィールド名と全く同じ内容の行があれば削除する
	data.data = data.data.filter(function(row){
		if (row[myPlotBy] ===myPlotBy) return false;
		if (row[myGroupBy]===myGroupBy) return false;
		if (row[mySortBy]===mySortBy) return false;
		return true;
	});

	// 重複したレコードがあれば削除する
	if (importOptions.isUniqueRecord){
		data.data = getUniqueRecordArray(data.data)
	};

	// Trimフラグがあれば行う
	if (importOptions.isTrimGarbage){
		data.data.forEach(function(row){
			row[myPlotBy] = trimGarbage(row[myPlotBy]);
		});
	}

	// Trimフラグがあれば行う
	if (importOptions.isTrimMansion){
		data.data.forEach(function(row){
			row[myPlotBy] = trimMansionOrlater(trimGarbage(row[myPlotBy]));
		});
	}

	// dataをプロット用のデータとして採用する
	myData = data;

	// 新しいデータでマップの初期化をしなおす
	initializeMap();
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

	// 各住所のgeocodeが成功する時のコールバックを設定
	GeoHandle.onLocate = myCallBack;

	//住所を重複なしのリストにして追加する
	GeoHandle.addAddress(myData.getList(myPlotBy));
}

// 各住所のgeocodeが成功する度に呼び出されるルーチン
function myCallBack(request, result){

	// マーカーを再描画
	refleshMarker();

	// ステータス表示用文章を用意
	var buffer = '';

	// 検索が成功した場所を追記
	buffer += request + 'を検索 ';

	// 残りの検索数を表示する
	// if (GeoHandle.listAddress.length) {
	buffer += '（残り' + (GeoHandle.listAddress.length)	+ '件）';
	// }

	// ステータスに表示する
	setStatusText(buffer, 2000);

}

// mapのオプションを設定する場所
function getMyMapOption(){
	var mapCenter = {lat:35.5, lng:139.6};
	var	mapzoom = 14;
	return {
		center:mapCenter,
		zoom:mapzoom,
		mapTypeControl:false,
		streetViewControl:false,
		streetViewControlOptions:{
			position: google.maps.ControlPosition.RIGHT_CENTER,
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
