//////////////////////////////////////////////////////////////////////
// geoHandle.js
//					require ttp://maps.google.com/maps/api/js?language=ja
//					require optinal window.localStorage
//					require optinal window.JSON
//////////////////////////////////////////////////////////////////////

'use strict'
var GeoHandle ={
	geocoder:{},
	listAddress:[],	 //配列 住所文字列
	cacheResult:{},	 //連想配列オブジェクト キーは登録時の住所文字列
										//プロパティにはlatlng:{lat:0,lng:0}, address:""
	nowRequest: "",	 //検索中の住所	検索が終わると空になる
	onLocate: false,		//アイテムが取得される度に呼ばれるcallback(geocoderResult)
	dummy:'',
	TIME_QUERYOVER: 300,
	TEXT_FAILED:'geocoder failed',
	useStorage: false //webstorageを使用するか
};

//	初期化する
GeoHandle.init = function (isStorage){
	GeoHandle.geocoder = new google.maps.Geocoder();
	GeoHandle.clearList();
	GeoHandle.clearCache();
	GeoHandle.useStorage = isStorage;
}

//	リストをリセットする
GeoHandle.clearList = function(){
	GeoHandle.listAddress = [];
}

GeoHandle.clearCache = function(){
	GeoHandle.cacheResult = {};
}

//	アドレスを追加する
//	param	 文字列、または文字列配列
//	isUrgent	急ぎかどうか		trueならunshiftで順番待ちに入れる
GeoHandle.addAddress = function(param, isUrgent){

	if(Array.isArray(param)){
		//配列の場合
		if(!isUrgent){
			GeoHandle.listAddress = GeoHandle.listAddress.concat(param);
		}else {
			GeoHandle.listAddress = param.concat(GeoHandle.listAddress);
		}

	}else if (typeof param==='string'){
		//文字列の場合
		if(!isUrgent){
			GeoHandle.listAddress.push(param);
		}else {
			GeoHandle.listAddress.unshift(param);
		}
	// その他
	}else{
		return;
	}

	// 重複をなくす
	GeoHandle.listAddress = GeoHandle.listAddress.filter(function(v, i, a){
		return a.indexOf(v) === i;
	});

	// 検索中でなければ検索を開始する
	if (GeoHandle.nowRequest == "") {
		GeoHandle.doNextSearch();
	}

};

//
GeoHandle.doNextSearch = function (){

	// 次検索アイテムをセットする
	if (!GeoHandle.prepareNextRequest()){
		//	falseなら終端。終了。
		 return;
	}else {
		//	次を検索する
		GeoHandle.doSearch();
	}
};

//next
GeoHandle.prepareNextRequest = function(){
	// リストが０ならばfalseを返す
	if (GeoHandle.listAddress.length <= 0) {
		return false;
	}
	// キーを取得
	var key = GeoHandle.listAddress.shift();

	//	すでに検査済ならスキップ
	if (GeoHandle.cacheResult[key]){
		return GeoHandle.prepareNextRequest();
	}
	//	リクエストのセット
	GeoHandle.nowRequest = key;
	return true;
};


// サーチを開始する
GeoHandle.doSearch = function (){

	// locaclStorageから該当を探す
	var result;
	if (GeoHandle.useStorage) result = GeoHandle.getLocalStorage(GeoHandle.nowRequest);

	if (result ){
		// 結果の取得に成功した時アクション
		GeoHandle.onGetResult(GeoHandle.nowRequest, result);

	}else {
		// localStorageに該当がない場合 googlemapのgeocoderを実行する
		GeoHandle.geocoder.geocode({address: GeoHandle.nowRequest}, GeoHandle.searchAddress);
	}
}

//住所検索結果の取得に成功した時のアクション
GeoHandle.onGetResult = function(request, result){

	// localStorageに格納
	if (GeoHandle.useStorage) GeoHandle.setLocalStorage(request, result);

	// Resultをキャッシュに格納
	GeoHandle.cacheResult[request] = result;

	// 検索中の文字列を空にする
	GeoHandle.nowRequest = "";

	// 次の検索を開始する
	GeoHandle.doNextSearch();

	// ユーザー指定のコールバックに飛ぶ
	if (GeoHandle.onLocate)	GeoHandle.onLocate(request, result);
}

//geocoderのcallback
GeoHandle.searchAddress = function (results, status){

	// GeocoderステータスがOKならResult{address, latlng}を取得する
	var saveResult = GeoHandle.getResultIfStatusOK(results, status);

	if (!saveResult ){
		//失敗時はクエリオーバーとして再度試す
		setTimeout(GeoHandle.doSearch, GeoHandle.TIME_QUERYOVER);
		return;
	}
	// ジオコード結果の取得に成功した時のアクションを実行する
	GeoHandle.onGetResult(GeoHandle.nowRequest, saveResult);

}

//
GeoHandle.getLocalStorage = function(key){

	// ブラウザがサポートしていなければ終了
	if (!localStorage || !JSON ){return;}
	// ストレージから情報を取得
	var Result = JSON.parse(localStorage.getItem(key));
	if (Result ){
		// JSONで戻したデータからLatLngオブジェクトを再生成する
		var lat = Result.latlng.lat;
		var lng = Result.latlng.lng;
		Result.latlng = new google.maps.LatLng(lat, lng);
		// result を返す
		return Result;
	}
}

GeoHandle.setLocalStorage = function(key, saveResult){
	// ブラウザがサポートしていなければ終了
	if (!localStorage || !JSON ){return;}
	// 情報をjson形式にして格納
	localStorage.setItem(key, JSON.stringify(saveResult));
}

GeoHandle.clearLocalStorage = function(){
	// ブラウザがサポートしていなければ終了
	if (!localStorage ){return;}
	// ストレージを全て消す
	localStorage.clear();
}



// TODO この関数いる？searchAddress内に入れた方がいい？
GeoHandle.getResultIfStatusOK =function(results, status){

	switch(status){
		case google.maps.GeocoderStatus.OK:
		//	成功の場合
			var saveResult = {};
			saveResult['latlng'] = results[0].geometry.location;
			saveResult['address'] = GeoHandle.getGcrAddressText(results[0]);
			return saveResult;

		case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
		//	クエリーを出しすぎて怒られた場合
			return false;				 // falseでリターンする

		default:
		// その他エラーの場合 // TODO エラー処理を書く
			//return GeoHandle.getEmptyResult();// 失敗用のデータをcacheに格納
			return {latlng: new google.maps.LatLng(), address: GeoHandle.TEXT_FAILED};
	}
}

//GeocodeResultから適度長さの（市町村以下の）住所名を取得する
GeoHandle.getGcrAddressText = function(gcResult){

	// ここに住所を格納していく
	var stradr="";

	console.log(gcResult.address_components);

	for(var i=0; i < gcResult.address_components.length; i++){
		var cmpnt = gcResult.address_components[i]
		var lname = cmpnt.long_name;

		// 挿入のあれこれ
		//マンション名はなにもしない
		if (cmpnt.types[0] =='premise'){
		
		//一つ目はとりあえず入れる
		}else if (stradr.length == 0){
			stradr = lname;
			
		//数字だけなら間にハイフンをはさんで追加する
		}else if (lname.match(/[^0-9０-９]/)==null){
				stradr = lname + '－' + stradr;
				
		//それ以外は普通に追加する
		}else {
				stradr = lname + stradr;
		}
		
		// ループ終了処理
		// 番地以外のものを挿入したらループを抜ける
		if (stradr.length > 0 ){
			// 番地要素
			if (!cmpnt.types.some(findSubLocatity2_9)){
				break;
			}
			// sublocality_level_2_9に当てはまればtrueを返す; premiseもtrueとして返す
			function findSubLocatity2_9(e){
				if (e == 'premise') return true;
				return e.match(/sublocality_level_[2-9]/);　// sublocalityの1は町名、2-9は番地など（個人調べ）
			}
		}
	}
	return stradr;
}

//
// END	class Geohandle
//////////////////////////////////////////////////////////////////////
