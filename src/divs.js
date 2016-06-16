//divs.js
// 各divエレメントの操作用の関数を書く
// --------------------------------------------------------------------
//	TantouDiv
// --------------------------------------------------------------------
// 担当者DIVを初期化する
function setTantouDiv(){

	// 担当者DIVの取得
	var $tantouDiv = $('#tantouDiv');

	// 中の要素を削除する
	$tantouDiv.empty();

	// すべて表示のtantouSpan作成する
	var $selallSpan = createTantouSpan('すべて表示');
	$selallSpan.click(event_SelallSpanClick);
	$selallSpan.appendTo($tantouDiv);

	// 各担当者のtantouSpanを作成する
	myData.getList(myGroupBy, true).forEach(function(element){
		var $tantouSpan = createTantouSpan(element);
		$tantouSpan.click(event_TantouSpanClick);
		$tantouSpan.appendTo($tantouDiv);
	});

	// 担当者の名前一覧のspanをつくる
	function createTantouSpan(tantouName){
		// コンテイナーに要素をいれていく
		var $container = $('<div>').attr(
			{'id': tantouName,
			'class': 'tantouSpan marked'}
		);

		//
		var $span = $('<span>').attr({'class': 'tantouItem'})
			.append($('<span>').attr({'class' : 'tantouItemHead'})
				.append($('<span>') // 担当者ごとの色の四角
					.css('background-color',getTantouCssColorText(tantouName))
					.text('__')
			))
			.append($('<span>').attr({'class' : 'tantouItemBody'})
				.append(tantouName)
			);

		$container.append($span);
		return $container;
	}

	// すべてを表示ボタンがクリックされた時
	function event_SelallSpanClick(){

		// すべて表示スパンをトグルする
		$(this).toggleClass('marked');

		// すべて表示スパンと他のスパンのmarkedを同期する
		if ($(this).hasClass('marked')){
			$(this).siblings().addClass('marked');
		}else{
			$(this).siblings().removeClass('marked');
		}

		// TantouSpanに変更があったときのアクションを実行する
		refleshMarker();

	}

	// TantouSpanがクリックされた時 markedクラスを付加する
	function event_TantouSpanClick(){

		// markedクラスをトグルする
		$(this).toggleClass('marked');

		// TantouSpanに変更があったときのアクションを実行する
		refleshMarker();
	};

	// TantouSpanに変更があったときのアクションを実行する
	function refleshTantouSpan(){
		// マーカーをリフレッシュする
		refleshMarker();
	}
}

// 表示非表示を切り替える
function toggleTantouDiv(){
	$('#tantouDiv').toggle();
}

// --------------------------------------------------------------------
//	statusDiv
// --------------------------------------------------------------------
function setStatusText(text, milliseconds){
	if (typeof setStatusText.DuraionCount === 'undefined'){
		setStatusText.DuraionCount = 0;
	}

	// default = 2000 msec
	if (!milliseconds) milliseconds = 2000;

	var $statusDiv = $('#statusDiv');
	var $statusText = $('#statusText');

	$statusDiv.show();
	$statusText.text(text);

	var resolution = 500; // milli milliseconds
	if (setStatusText.DuraionCount <= 0 ){
		setTimeout(countDown, resolution);
	}
	setStatusText.DuraionCount = Math.floor(milliseconds / resolution);

	function countDown(){
		setStatusText.DuraionCount--;
		if (setStatusText.DuraionCount <= 0){
			$statusDiv.fadeOut();
		}else{
			setTimeout(countDown, resolution);
		}
	}
}
// --------------------------------------------------------------------
//	dataDiv
// --------------------------------------------------------------------
// データ取込フォーム dataDiv関連のイベントを設定する
function setDataDivEvents(){
	// プロット開始ボタン
	$('#dataBtnImport').click(function(){
		toggleDataDiv();
		importData(
			$('#dataText').val(),
			$('#dataChkUnique').prop('checked'),
			$('#dataChkTrim').prop('checked'),
			$('#dataChkMansion').prop('checked')
		);
	});

	// 再構成ボタン
	$('#dataBtnReset').click(function(){
		toggleDataDiv();
		importData(
			$('#dataText').val(),
			$('#dataChkUnique').prop('checked'),
			$('#dataChkTrim').prop('checked'),
			$('#dataChkMansion').prop('checked'),
			true// reset true
		);
	});

	// キャッシュを削除ボタン
	$('#dataBtnClearCache').click(function(){
		// ローカルストレージを削除
		GeoHandle.clearLocalStorage();
		// GeoHandleのキャッシュも削除
		GeoHandle.clearCache();
	});

	// 左上の×ボタン
	$('#dataClose').click(toggleDataDiv)
}

// dataDivの表示・非表示を切り返す
function toggleDataDiv(){

	// DOMの取得
	var $dataDiv = $('#dataDiv');
	var $dataText = $('#dataText');

	// 表示・非表示を切り替える
	$dataDiv.toggle();

	// 表示ＯＮならテキストにフォーカス等の操作をする
	if ( $dataDiv.is(':visible') ){
		setTimeout(function(){
			// 現在のデータをCSVにして再表示
			if (myData) $dataText.val(myData.csvOutput('\t'));
			$dataText.focus();
			// $dataText.append('');
		}, 1);
	}
}
// --------------------------------------------------------------------
//	shareDiv
// --------------------------------------------------------------------
function toggleShareDiv(){
	// データが無ければ終了
	if (!myData){
		$('#shareDiv').hide();
		return;
	}

	// 表示・非表示を切り替える
	$('#shareDiv').toggle();

	// 表示ONなら
	if($('#shareDiv').is(':visible')){

		// 閉じるボタンイベント
		$('#shareClose').click(function(){
			$('#shareDiv').hide();
		});

		// OKイベント
		$('#shareOKBtn').click(function(){

			// セレクトボックスで選択されている一覧
			var selected = $('#shareSelect').val();

			// uriに変換する
			var uriText = exportData(selected);
			if (uriText)$('#shareURIField').val(uriText);
		});

		// グループ一覧をセレクトボックスに格納
		$('#shareSelect').empty();
		myData.getList(myGroupBy, true).forEach(function(e){
			$('#shareSelect').append($('<option>').val(e).text(e));
		});

	}
}

// --------------------------------------------------------------------
//	dialogDiv
// --------------------------------------------------------------------
function setDialogDiv(title, message, arrOptions, onOK, optionDefault){
	// div要素の表示
	$('#dialogDiv').show();

	// タイトルの設定
	$('#dialogTitle').text(title);

	// メッセ―ジの設定
	$('#dialogMessage').text(message);

	// セレクトボックスアイテムの設定
	$('#dialogSelect').empty();
	for (var i = 0; i < arrOptions.length; i++){
		$('#dialogSelect').append(
			$('<option>').text(arrOptions[i]).val(arrOptions[i])
		);
	}

	//セレクトボックスをデフォルト値にセット
	$('#dialogSelect').val(optionDefault);

	//セレクトボックスにデフォルト値に合致するものが無ければ一番上を選択状態にする
	if (!$('#dialogSelect').val()){
		$('#dialogSelect').val(arrOptions[0]);
	}

	// OKボタンを押したときのイベント
	$('#dialogOKBtn')[0].onclick = function(){
		// div要素の非表示
		$('#dialogDiv').hide();
		// セレクトオプションを戻り値にしてcallbackに返す
		if (onOK) onOK( $('#dialogSelect').val() );
	};

	// Cancelボタんを押されたら閉じる
	$('#dialogClose')[0].onclick = function(){
		$('#dialogDiv').hide();
	}

}

// --------------------------------------------------------------------
//	searchDiv
// --------------------------------------------------------------------
function toggleSearchDiv(){
	// 表示を切替
	$('#searchDiv').toggle();

	// searchSelectの要素を初期化する
	refleshSearchDivSelect();
}

// サーチボックスにイベントを追加する
function setSearchDivEvents(){

	// 順番テキストにフォーカスを移す
	$('#searchGroup').keypress(function(e){
		onPressEnterFocusTo(e, '#searchOrderNo');
	});

	// 住所テキストにフォーカスを移す
	$('#searchOrderNo').keypress(function(e){
		onPressEnterFocusTo(e, '#searchAddress');
	});

	// 検索ボタンにフォーカスを移す
	$('#searchAddress').keypress(function(e){
		onPressEnterFocusTo(e, '#searchButton');
	});

	// セレクトボックスが変更された時に呼び出される
	$('#searchSelect').change(onSearchDivSelectChanged);

	// 検索した住所でマーカーを作成する
	$('#searchButton').click(addMarkerSearchDiv);
}


// セレクトボックスが変更された時に呼び出される
function onSearchDivSelectChanged(){
	// 選択中のグループの取得
	var groupName = $(this).val();

	// グループ名の代入　
	$('#searchGroup').val(groupName);
	if (groupName === 'newGroup') {　// newGroupを選択中ならグループ名にetcを入れる
		$('#searchGroup').val('etc');
	}

	// 順番欄に選択中グループの最大値＋１を格納する
	$('#searchOrderNo').val(getMaxOrderOfGroup(groupName) + 1);

	// 住所テキストをフォーカス
	$('#searchAddress').focus();
}


// searchSelectの要素を初期化する
function refleshSearchDivSelect(){
	// セレクトボックス
	var $select = $('#searchSelect');

	// 初期化する
	$select.empty();

	// 各グループを入れる
	if (myData){
		var groupList = myData.getList(myGroupBy, true);
		groupList.forEach(function(groupName){
			$select.append($('<option>', {value: groupName, text: groupName}));
		});
	}

	// newGroupを追加
	$select.append(
		$('<option>', {value: 'newGroup', text: 'newGroup'})
	);

	// newGroup選択した状態でイベントを起こす
	$select.val('newGroup');
	$select.change();

	// サーチボックスにフォーカスをあててておく
	$('#searchAddress').focus();
}

// 検索した住所をマーカーにする
function addMarkerSearchDiv(){

	// 追加用レコードを作成する
	var addData = {};
	addData[myGroupBy] = $('#searchGroup').val();
	addData[mySortBy] = $('#searchOrderNo').val();
	addData[myPlotBy] = $('#searchAddress').val();

	// データにレコードをプッシュする
	if (!myData){
		myData = new dataHandle.ObjectArray([ addData]);
	}else{
		myData.data.push(addData);
	}

	// マーク状態を保存する
	var markedArr = backupSpansMarked();
	// マップを初期化する
	initializeMap();
	// マーク状態を復元する
	restoreSpansMarked(markedArr);

	// 新規追加のグループのマークはすべて表示に倣う
	if (markedArr.indexOf(addData[myGroupBy]) == -1){
		if (markedArr.indexOf('すべて表示') != -1){
			$('#' + selectorEscape(addData[myGroupBy])).addClass('marked')
		}
	}

	// addDataのグループをフォーカスにして、マーカーを中央に表示する
	// TODO manageSlideが気に食わない
	setFocusedTantou(addData[myGroupBy]);
	manageSlide(0, addData[mySortBy]);

	$('#searchOrderNo').val(parseInt($('#searchOrderNo').val()) + 1);
	$('#searchAddress').val('');
	$('#searchAddress').focus();

}


// --------------------------------------------------------------------
// slideDiv
// --------------------------------------------------------------------
// 切替スライドのイベントを設定する
function setSlideDivEvents(){
	$('#slideForward').click(function(){manageSlide(1);});
	$('#slideBackward').click(function(){manageSlide(-1);});
	$('#slideNowTantou').click(function(){fitMapBoundsFocusedMarkers();});
	$('#slideNowAddress').click(function(){manageSlide(0); myMap.setZoom(16);})
}

// スライドの表示IDを管理・反映
function manageSlide(increment, setId){
	// 状態変数の初期化
	if (typeof manageSlide.id === 'undefined'){
		manageSlide.id = 0;
	}
	if (setId){
		manageSlide.id = setId;
	}

	// focused担当者のデータ一覧を取得
	var newData = getFocusedTantouData();

	// 状態変数増減させる
	manageSlide.id += increment
	manageSlide.id = Math.max(manageSlide.id, 0);
	manageSlide.id = Math.min(manageSlide.id,	newData.length - 1);

	// データをスライド情報に反映させる
	applySlideData(newData[manageSlide.id]);

}

// データをスライド情報に反映させる
function applySlideData(curRow){

	// slideNowAddressに表示させる
	$('#slideNowAddress').text( curRow[myPlotBy]);

	// slideNowTantouに情報を表示
	$('#slideNowTantou').empty();
	$('#slideNowTantou').append( //
		$('<span>')
			.css('background-color', getTantouCssColorText(curRow[myGroupBy]))
			.text('__'));
	$('#slideNowTantou').append(
		curRow[myGroupBy] + '（' + curRow[mySortBy] + '）');

	// マップ座標の変更
	var result = GeoHandle.cacheResult[curRow[myPlotBy]];
	if ( !result || result.address == GeoHandle.TEXT_FAILED) return;
	myMap.setCenter(result.latlng);
}

// --------------------------------------------------------------------
//	setSwitchDiv
// --------------------------------------------------------------------
// グループ切替セレクトボックスを設置する
function setSwitchDiv(){
	// DOMの取得
	var $switchSelect = $('#switchSelect');

	// 一度中身を空にする
	$switchSelect.empty();

	// 担当者一覧でオプションを作成する
	myData.getList(myGroupBy, true).forEach(function(tantou){
		$('<option>')
			.val(tantou)
			.text(tantou)
			.appendTo($switchSelect);
	});

	// 担当者が変更された時のイベント
	$switchSelect.change(function(){
		// 担当者名を取得
		var tantou = $(this).find('option:selected').text();

		// 指定した担当スパンをフォーカス状態にする
		setFocusedTantou(tantou);

	});

	// 強制的に変更イベントを起こす
	setTimeout(function(){
			$switchSelect.trigger('change');
		},1000);
}
