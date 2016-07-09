// uniques.js
// --------------------------------------------------------------------
//	uniques このプロジェクト固有の関数
// --------------------------------------------------------------------
// 担当者の名前から色を選出する
function getTantouCssColorText(tantouName){
	var tantouArr = myData.getList(myGroupBy);
	var index = tantouArr.indexOf(tantouName);
	var length = tantouArr.length;
	return 'hsla(' +(300/length*index)	+ ' , ' + (35+((index%2)*25))+ '%, 50%, 1)'
}

// 指定した担当スパンをフォーカス状態にする
function setFocusedTantou(tantou){

	// セレクタに使うためにエスケープした物を用意
	var esc_tantou= selectorEscape(tantou);

	// 他の担当スパンのフォーカスを消す
	$('#' + esc_tantou).siblings().removeClass('focused');
	// 自身の担当スパンをフォーカス状態にする
	$('#' + esc_tantou).addClass('focused');

	// セレクトボックス中で選択状態にする
	// $('#switchSelect').val(getFocusedTantou());
	$('#switchSelect').val(tantou);

	// 住所を調べる
	var getOptions = {
		findLabel : myGroupBy,
		findValue : tantou
	}
	var addressList = myData.getList(myPlotBy, getOptions)
	GeoHandle.addAddress(addressList,true);

	// スライドの表示IDを管理・反映
	manageSlide(0, 0);

	// スライドDIVを再表示
	$('#slideDiv').show();

	refleshMarker();
}

// フォーカス状態のグループ名を取得する
function getFocusedTantou() {
	return $('.tantouSpan.focused').attr('id');
}

// focused担当者のデータを取得
function getFocusedTantouData(){
	var tantou = $('.tantouSpan.focused').attr('id');
	var newData = myData.data.filter(function(row){
		return row[myGroupBy]==tantou}
	);
	return newData;
}


// 指定グループの最終インデックスを取得する
function getMaxOrderOfGroup(groupName){
	// データがまだ無ければ0を返す
	if (!myData){return 0;}

	// データから該当グループの順番フィールドの配列を取得
	var getOptions = {
		findLabel : myGroupBy,
		findValue : groupName
	}
	var listOrders = myData.getList(mySortBy, getOptions);

	// 順番配列の取得に失敗したら0を返す
	if (!listOrders) {
		return 0;
	}else if(listOrders.length == 0){
		return 0;
	// 配列の取得に成功したら、配列の中で最も大きい数を返す
	}else{
		return Math.max.apply(null, listOrders);
	}
}

//focused中のマーカーを表示するようにマップの表示領域を変更する
function fitMapBoundsFocusedMarkers(){

	//	データの担当者一つ一つに対して
	var flgFirst = false;
	myData.data.forEach(function(dataRow, id){
		if (isTantouSpanClassed(dataRow[myGroupBy], 'focused')){
			if (myMarkerArr[id]){
				// 一つ目の場合、myBoundを初期化
				if (!flgFirst) myBounds = null;
				flgFirst = true;
				//表示領域を広げる
				mapExpandBounds(myMarkerArr[id]);
			}
		}
	});
}
// 指定マーカーに合わせてマップの表示領域を拡大する
function mapExpandBounds(marker){
	//var curBounds = myBounds;
	if (!myBounds) myBounds = new google.maps.LatLngBounds();
	if (!myBounds.contains(marker.getPosition())){
		myBounds.extend(marker.getPosition());
		myMap.fitBounds(myBounds);
	}
}

// 担当者スパンに特定のクラスが付いているか判別する
function isTantouSpanClassed(tantou, className){
	if (typeof tantou !== 'string') return false;
	var flg = false;
	$('.tantouSpan').each(function(){
		if ($(this).hasClass(className) && $(this).attr('id') == tantou ){
			flg = true;
		}
	});
	return flg;
}

// 各グループスパンのマーク状態を取得する
function backupSpansMarked(){
	var markedArr = [];
	$('.tantouSpan.marked').each(function(){
		markedArr.push($(this).attr('id'));
	});
	return markedArr;
}

// 配列で示されたグループスパンのマーク状態にする
function restoreSpansMarked(markedArr){
	// 配列でなければ終了
	if (!Array.isArray(markedArr)) return;

	// 一度すべてのマークを外す
	$('.tantouSpan').removeClass('marked');

	// 配列のグループのみマークしなおす
	markedArr.forEach(function(element){
		$('#' + selectorEscape(element)).addClass('marked');
	});
}
