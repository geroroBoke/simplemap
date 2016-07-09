// generals.js

// --------------------------------------------------------------------
//	generals 他のプロジェクトでも使えそうなもの
// --------------------------------------------------------------------
//文字列からスペースと”。”を取り除く
function trimGarbage(str){
		if (typeof str != 'string') return; //throw new Error('string型を引数にいれてください');
		str = str.replace(/[ 　]/g, "");
		str = str.replace(/。/g, "");
		return str;
}

// 住所文字列からマンション名（と思われるもの）以降を取り除く	数字より後ろの文字はマンション名と判断する
function trimMansionOrlater(str){
	// 文字列でない場合は終了
	if (typeof str != 'string') return;
	// 数字と区切り文字の定義
	var arrNumber = '0123456789０１２３４５６７８９';
	var arrDelimiter = '[ 　-ーー〜~−ｰー‐－の丁目]';
	// 実行する
	var flgNumber = false; // 数字がすでに出現している
	for(var i = 0 ; i < str.length ; i++){
		var c = str.charAt(i);
		if (!flgNumber ){
			flgNumber = (arrNumber.indexOf(c) != -1 );
		} else {
			// 数字でもなく、区切り文字でもない
			if (arrNumber.indexOf(c) == -1 && arrDelimiter.indexOf(c) == -1	)
			break;
		}
	}
	return str.substr(0, i);
}

// セレクタで使われる記号をエスケープする
function selectorEscape(val){
		return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
}

// 配列のレコード重複をなくす	TODO 無理やりすぎる
function getUniqueRecordArray(array) {
	var storage = {};
	return array.filter(function(value){
		if (!(JSON.stringify(value) in storage)) {
			storage[JSON.stringify(value)] = true;
			return true;
		}
	});
}
// Enterキーが押されたら指定のアイテムにフォーカスを移す
function onPressEnterFocusTo(e, selector){
	if ( e.keyCode == 13 ) {
		$(selector).focus();
		e.preventDefault();
	}
}
