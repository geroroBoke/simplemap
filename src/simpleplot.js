/*
  don't forget
    main()をこしらえる
    各divごとにオブジェクトにまとめる？
*/

	(function(){
		'use strict'
		// --------------------------------------------------------------------
		//  functions 他のプロジェクトでも使えそうなもの
		// --------------------------------------------------------------------
		//文字列からスペースと”。”を取り除く
		function trimGarbage(str){
				if (typeof str != 'string') return; //throw new Error('string型を引数にいれてください');
				str = str.replace(/[ 　]/g, "");
				str = str.replace(/。/g, "");
				return str;
		}
		// 住所文字列からマンション名（と思われるもの）以降を取り除く  数字より後ろの文字はマンション名と判断する
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
					if (arrNumber.indexOf(c) == -1 && arrDelimiter.indexOf(c) == -1  )
					break;
				}
			}
			return str.substr(0, i);
		}

		// セレクタで使われる記号をエスケープする
		function selectorEscape(val){
		    return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
		}

		// 配列のレコード重複をなくす  TODO 無理やりすぎる
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


		// --------------------------------------------------------------------
		//  unique function このファイル固有の関数
		// --------------------------------------------------------------------
		// 担当者の名前から色を選出する
		function getTantouCssColorText(tantouName){
			var tantouArr =myData.getList(myGroupBy, true);
			var index = tantouArr.indexOf(tantouName);
			var length = tantouArr.length;
			return 'hsla(' +(300/length*index)  + ' , ' + (35+((index%2)*25))+ '%, 50%, 1)'
		}

		// 指定した担当スパンをフォーカス状態にする
		function setFocusedTantou(tantou){

			// セレクタに使う記号をエスケープする
			tantou = selectorEscape(tantou);

			// 他の担当スパンのフォーカスを消す
			$('#' + tantou).siblings().removeClass('focused');
			$('#' + tantou).addClass('focused');

			// 現在のフォーカス値を選択状態にする
			$('#switchSelect').val(getFocusedTantou());

			// 優先的に住所を調べる
			GeoHandle.addAddress(myData.getList(myPlotBy, true, myGroupBy, tantou), true);

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
			var listOrders = myData.getList(mySortBy, true, myGroupBy, groupName);

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

		// --------------------------------------------------------------------
		//  TantouDiv
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


		}

		// 表示非表示を切り替える
		function toggleTantouDiv(){
			$('#tantouDiv').toggle();
		}

		// 担当者の名前一覧のspanをつくる
		function createTantouSpan(tantouName){

			// コンテイナーに要素をいれていく
			var $container = $('<div>').attr({'id': tantouName, 'class': 'tantouSpan marked'});
			//
			var $span = $('<span>')
				.attr({'class': 'tantouItem'})
				.append($('<span>').css('background-color', getTantouCssColorText(tantouName)).text('__'))
				.append(tantouName);

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

			// // スライドDIVを消す
			// $('#slideDiv').hide();
			//
			// // フォーカスされているスパンが存在すれば以下の
			// var focused = getFocusedTantou();
			// if (focused){
			// 	// 優先的に住所を調べる
			// 	GeoHandle.addAddress(myData.getList(myPlotBy, true, myGroupBy, focused), true);
			//
			// 	// スライドの表示IDを管理・反映
			// 	manageSlide(0, 0);
			// 	// スライドDIVを再表示
			// 	$('#slideDiv').show();
			// }

			// マーカーをリフレッシュする
			refleshMarker();
		}

		// --------------------------------------------------------------------
		//  createMarker
		// --------------------------------------------------------------------
		// GeoHandleのchacheResultに基づいてマーカーを作成する
		function createMarker(id, result, dataRow, isFocused){

			// richMarkerのプロパティ
			var latlng = result.latlng;
			// 吹き出しの中身
			var labelText = "";
			labelText += dataRow[myGroupBy].match(/[^\d:;#]/);// 数字や記号以外で最初の一文字を取得する
			labelText += dataRow[mySortBy].match(/[\d]+/); // 連続した数字を取得する
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
						.css({'background-color' : colorText,'border-top-color':  colorText})
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
		//  refleshMarker
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
		//  parseOption
		// --------------------------------------------------------------------
		function retriveParseOption(srcText, getField){
			var result = '';
			// 行ごとに分解
			srcText.split('\n').forEach(function(line){
				// #で始まる行は制御文
				if (line.substr(0,1) == '#'){
					var param = line.substr(1).split(':');
					// :以前が該当フィールドなら:以後をリターン
					if (param[0] == getField ) result =  param[1];
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
		// --------------------------------------------------------------------
		//  importData
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
			dataText = trimParseOptions(dataText);// 最後に#制御文を取り除く

			// テキストをパースする
			var data = dataHandle.csvParse(dataText, '\t', true);

			// パースできていなければ終了
			if (!data) return;

			// データ上に指定フィールドが無ければ、フィールド再選択ダイアログボックスを起動して、再起動
			if ( isReset
				|| data.getList(myPlotBy)[0] == undefined
				|| data.getList(myGroupBy)[0] == undefined
				||  data.getList(mySortBy)[0] == undefined ){
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
		//  initializeMap
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
			if (GeoHandle.listAddress.length) buffer += '（残り' + (GeoHandle.listAddress.length)  + '件）';
			setStatusText(buffer, 2000);

		}
		// --------------------------------------------------------------------
		//  statusDiv
		// --------------------------------------------------------------------
		function setStatusText(text, milliseconds){
			// default = 2000 msec
			if (!milliseconds) milliseconds = 2000;

			var $statusDiv = $('#statusDiv');
			var $statusText = $('#statusText');

			$statusDiv.show();
			$statusText.text(text);

			var resolution = 500; // milli milliseconds
			if (myStatusDuraionCount <= 0 ){
				setTimeout(countDown, resolution);
			}
			myStatusDuraionCount = Math.floor(milliseconds / resolution);

			function countDown(){
				myStatusDuraionCount--;
				if (myStatusDuraionCount <= 0){
					$statusDiv.fadeOut();
				}else{
					setTimeout(countDown, resolution);
				}
			}
		}

		// --------------------------------------------------------------------
		//  dataDiv
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
			$('#dataBtnClearStorage').click(function(){
				GeoHandle.clearLocalStorage();
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
					if (myData) $dataText.val(dataHandle.csvOutput(myData.data, '\t') );
					$dataText.focus();
					// $dataText.append('');
				}, 1);
			}
		}
		// --------------------------------------------------------------------
		//  dialogDiv
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
				$('')//TODO TODO TODO TODO TODO
				$('#dialogSelect').val(0);
			}



			// OKボタンを押したときのイベント
			$('#dialogOKBtn')[0].onclick = function(){
				// div要素の非表示
				$('#dialogDiv').hide();
				// セレクトオプションを戻り値にしてcallbackに返す
				if (onOK) onOK( $('#dialogSelect').val() );
			};

		}

		// --------------------------------------------------------------------
		//  searchDiv
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
			if (setId ){
				manageSlide.id = setId;
			}

			// focused担当者のデータ一覧を取得
			var newData = getFocusedTantouData();

			// 状態変数増減させる
			manageSlide.id += increment
			manageSlide.id = Math.max(manageSlide.id, 0);
			manageSlide.id = Math.min(manageSlide.id,  newData.length - 1);

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
		//  setSwitchDiv
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

		// --------------------------------------------------------------------
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

		// --------------------------------------------------------------------
		//  main
		// --------------------------------------------------------------------
		// トグルスイッチ
		$('#toggleDataBtn').click(toggleDataDiv);
		$('#toggleSearchBtn').click(toggleSearchDiv);
		$('#toggleTantouBtn').click(toggleTantouDiv);

		// 取り込みボタンのイベントを設定する
		setDataDivEvents();

		// 検索ボタンのイベントを設定する
		setSearchDivEvents();

		// 切替スライドのイベントを設定する
		setSlideDivEvents();

		// myData ObjectArrayオブジェクト用の変数を宣言する importData内で初期化されます
		var myData = null;

		// statusTextを表示しつづける時間を格納
		var myStatusDuraionCount = 0;

		// オプション用の変数を用意 デフォルトを設定 importData内で再設定できます
		var myTitle = getDefaultParseOption('title');
		var myGroupBy = getDefaultParseOption('groupby');
		var mySortBy = getDefaultParseOption('sortby');
		var myPlotBy = getDefaultParseOption('plotby');

		// マーカー配列を用意
		var myMarkerArr = [];

		// マップの表示領域を格納する
		var myBounds = new google.maps.LatLngBounds();

		// googleマップの読込み
		var myMap = new google.maps.Map($('#map')[0], getMyMapOption());

		// URIに#以降があればそのパラメータでimportDataを行う
		if (location.hash.length >= 0){
			importData(decodeURI(location.hash.substring(1)),
			true, true ,true);// default true true
		}

		// geocoderキャッシュ管理オブジェクトを初期化
		GeoHandle.init(true);

	})();
