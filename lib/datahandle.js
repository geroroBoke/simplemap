// dataHandle
// --ObjectArray
//1602061617
//1606152136	arrayArrayは削除（一旦別ファイルに除却する）
//1607100007	getListのパラメータはoptionsオプジェクトで引き渡す

// nameSpace
var dataHandle;
if (!dataHandle){
	dataHandle = {};
}

// =======================================================
// ObjectArray
// =======================================================
	//constructor
	dataHandle.ObjectArray = function(data){
		this.data = data;
	}

	// 指定フィールドのみを抽出してObjectArrayインスタンスを作る
	dataHandle.ObjectArray.prototype.filterColumn = function(fieldLabels){

		// フィールドは配列で渡されなくてはならない
		if (!Array.isArray(fieldLabels)) return;

		// 編集用のデータを用意
		var tempData = [];

		// １行ずつObject1Arrayを紡いでいく
		tempData = this.data.map(function(element, index, array){

			// 新しい行をこの中に作成していく
			var newRow = {};

			// 指定フィールドだけ新しい行に追加していく
			fieldLabels.forEach(function(key){
				newRow[key] = element[key];
			});

			// １行分を配列の要素として返す
			return newRow;
		});

		// tempDataを元にObjectArrayインスタンスを生成する
		return new this.constructor(tempData);
	}

	// 該当する行のみを抽出してObjectArrayインスタンスを生成する
	dataHandle.ObjectArray.prototype.filterRow = function(findLabel, findValue){

		// ラベル、値が指定されていなければ終了
		if (!findLabel || !findValue  ) return ;

		// 編集用のデータを用意
		var tempData = [];

		// 該当する行のみを抽出する
		tempData = this.data.filter(function(element, index, array){

			if (!element[findLabel]) return;

			// 1.findValueが配列の場合　// 配列のいずれかに等しければOK
			if ( Array.isArray(findValue) ){
				return findValue.some(function(value){
					return element[findLabel] === value;
				});

			// 2.findValueが*="で始まる場合 // 値が部分一致すればOK
			}else if (findValue.substr(0,2) == '*='){
				return element[findLabel].indexOf(findValue.slice(2)) != -1 ;

			// 3.findValueが配列の場合　 // 値が全部一致すればOK
			}else{
				return element[findLabel] === findValue;
			}
		});

		// tempDataを元にObjectArrayインスタンスを生成する
		return new this.constructor(tempData);
	}

	// 指定フィールドに基づいて配列を並び替える
	dataHandle.ObjectArray.prototype.sortRow = function( sortLabel, isAscend){
		// データの対象
		var tempData = this.data;

		// 昇降フラグを整理する
		if (isAscend === undefined ) isAscend = true;
		var flag =	( isAscend ) ? 1 : -1 ;

		// ソートする
		tempData.sort(function(v1, v2){
			return (v1[sortLabel] - v2[sortLabel]) * flag;
		});

		return this;
	}

	//	指定フィールドを抽出して文字配列として返す
	dataHandle.ObjectArray.prototype.getList = function(getLabel, options){
		// options{
		// isNotUnique : 配列中の重複を許す
		// findLabel : 該当行に絞る、判別するフィールド名
		// findValue : 該当行に絞る、判別する値
		// sortLabel : 並び変えの基準にするフィールド名
		// isAscend : 並び順を昇順にする
		//}

		// 編集用のデータを取得
		var tempObjArr = this;

		if (!options) options = {};

		// 行指定があれば対象行をしぼる
		if (options.findLabel && options.findValue){
			tempObjArr = tempObjArr.filterRow(options.findLabel, options.findValue);
		}

		// ソート指定があればソートする
		if ( options.sortLabel ){
			tempObjArr.sortRow(options.sortLabel, options.isAscend);
		}

		// 取得したいラベルのみのリストを作成する
		var tempList = [];
		tempList = tempObjArr.data.map(function(element, index, array){
			return element[getLabel];
		});

		// 重複をなくす
		if (!options.isNotUnique){
			tempList = tempList.filter(function(element, index, array){
				return array.indexOf(element) === index;
			});
		}

		return tempList;
	}
  // -------------------------------------------------------
  // csvOutput Method
  // -------------------------------------------------------
  // out CSV based on data of ObjectArray
  // arguments
  //  chrDelimiter
  // returns	CSV text in which each field in a record is separated by chrDelimiter.
  dataHandle.ObjectArray.prototype.csvOutput = function(chrDelimiter){

    var workdata = this.data;

  	// for ObjectArray only
  	if ( !Array.isArray( workdata )) return;
  	if (	workdata.length === 0 ) return;

  	// is workdata ObjectArray TODO requires more strict examination
    var flgObjectArray = (Object.prototype.toString.call(workdata[0]) == '[object Object]');
    if (!flgObjectArray) return;

  	return outputObjectArray(workdata, chrDelimiter);

		// innerfunction
  	function outputObjectArray(workdata, chrDelimiter){

  		var strTemp = '';

  		// get HeadLines based on firstRow workdata keys
  		var keys = Object.keys(workdata[0]);

  		// output HeadLines
  		strTemp += keys.join(chrDelimiter) + '\n';

  		// output each item on each row
  		workdata.forEach(function(row){
  			keys.forEach(function(key, id , arr){
  				strTemp += row[key];
  				strTemp += (id < arr.length -1 ) ? chrDelimiter : '\n'
  			});
  		});
  		return strTemp;
  	}
  }

	// -------------------------------------------------------
	// csvParse Method
	// -------------------------------------------------------
	// parse csv into ObjectArray
  // arguments
	//   strSrc	 sourceCSV
	//   chrDelimiter  demiliter
	// returns: generated ObjectArray based on csv
	dataHandle.ObjectArray.csvParse = function(strSrc, chrDelimiter){
		var tempData = [];
		var lines = strSrc.split('\n');

		if (lines.length < 2) return;
		var heads = lines[0].split(chrDelimiter);
		for (var i = 1; i < lines.length; i ++){

			// emptyline ; skip
			if (lines[i] == '') break;

			// split by delimiter
			var vals = lines[i].split(chrDelimiter);
			if (vals.length	== 0 ) break;

			// add object
			tempData[i-1] = {};
			for (var j = 0; j < vals.length; j++){
				tempData[i-1][heads[j]] = vals[j];
			}
		}
    // return as new ObjectArray
		return new dataHandle.ObjectArray(tempData);
	}
