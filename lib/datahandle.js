// dataHandle
// --ObjectArray
//1602061617
//1606152136	arrayArrayは削除（一旦別ファイルに除却する）

// nameSpace
var dataHandle;
if (!dataHandle){
	dataHandle = {};
}

// =======================================================
// ObjectArray Class
// =======================================================
	dataHandle.ObjectArray = function(data){
		this.data = data;
	}

	// 該当する行に絞るフィルタをかけて新しいObjectArrayを生成するメソッド
	dataHandle.ObjectArray.prototype.filterRow = function(findLabel, findValue){
		// 編集用のデータを用意
		var tempData = this.data;

		// 検索指定があれば対象行をしぼる
		if (findLabel && findValue){
			tempData = tempData.filter(function(element, index, array){
				// 該当フィールド見当たらなければ終了
				if (!element[findLabel]) return;

				if ( Array.isArray(findValue) ){
					//	配列　配列のいずれかに等しい
					return findValue.some(function(value){
						return element[findLabel] === value;
					});

				}else if (findValue.substr(0,2) == '*='){
				　// "*=VALUE" VALUEを含む
					return element[findLabel].indexOf(findValue.slice(2)) != -1 ;

				}else{
					// "VALUE" VALUEに等しい
					return element[findLabel] === findValue;
				}
			})
		}
		return new this.constructor(tempData);
	};

	dataHandle.ObjectArray.prototype.sortRow = function( sortLabel, isAscend){
		// データの対象
		var tempData = this.data;

		// 昇降フラグを整理する
		if (isAscend === undefined ) isAscend = true;
		var flag =	( isAscend ) ? 1 : -1 ;

		// ソートする
		tempData.sort(function(v1, v2){
			// 数値
			return (v1[sortLabel] - v2[sortLabel]) * flag;
			// // 文字列
			// if (v1[sortLabel] < v2[sortLabel]){
			//	 return -1 * flag;
			// }else {
			//	 return	1 * flag;
			// }
		});

		return this;
	}

	//	任意のカラムを配列として返すメソッド
	// dataHandle.ObjectArray.prototype.getList = function(getLabel, isUnique, findLabel, findValue){
	dataHandle.ObjectArray.prototype.getList = function(getLabel, isUnique, findLabel, findValue, sortLabel, isAscend){

		// 編集用のデータを取得
		var tempObjArr = this;

		// 検索指定があれば対象行をしぼる
		if (findLabel && findValue){
			tempObjArr = tempObjArr.filterRow(findLabel, findValue);
		}

		// ソート指定があればソートする
		if ( sortLabel ){
			tempObjArr.sortRow(sortLabel, isAscend);
		}

		// 取得したいラベルのみのリストを作成する
		var tempList = [];
		tempList = tempObjArr.data.map(function(element, index, array){
			return element[getLabel];
		});

		// 一意データフラグがONなら
		if (isUnique){
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
