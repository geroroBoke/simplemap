// dataHandle
// --csvParse
// --ArrayArray
// --ObjectArray
//1602061617

// nameSpace
var dataHandle;
if (!dataHandle){
  dataHandle = {};
}
// =======================================================
// csvParse Method
// =======================================================
// parseInto ObjectArray or ArrayArray
// strSrc				source
// isUseHeader	use a firstline as a header
// ...returns		isUseHeader:true   ObjectArray
// ...returns		isUseHeader:false  ArrayArray
dataHandle.csvParse = function(strSrc, chrDelimiter, isUseHeader){
  var tempData = [];
  var lines = strSrc.split('\n');
  if (isUseHeader){
    // parse As an ObjectArray ---------
    if (lines.length < 2) return;
    var heads = lines[0].split(chrDelimiter);
    for (var i = 1; i < lines.length; i ++){
      // emptyline ; skip
      if (lines[i] == '') break;

      // split by delimiter
      var vals = lines[i].split(chrDelimiter);
      if (vals.length  == 0 ) break;

      // add object
      tempData[i-1] = {};
      for (var j = 0; j < vals.length; j++){
        tempData[i-1][heads[j]] = vals[j];
      }
    }
    return new this.ObjectArray(tempData);

  }else{
    // parse as an ArrayArray -----------
    if (lines.length < 1) return;
    for (var i = 0; i < lines.length; i ++){
      // emptyline ; skip
      if (lines[i] == '') break;

      // split by delimiter
      var vals = lines[i].split(chrDelimiter);
      tempData[i]=[];
      for (var j = 0; j < vals.length; j++){
        tempData[i][j] = vals[j];
      }
    }
    return new this.ArrayArray(tempData);
  }
}

// =======================================================
// csvOutput Method
// =======================================================
// out CSV based on data of ObjectArray or ArrayArray
// data
// returns  CSV text in which each field in a record is separated by chrDelimiter.
dataHandle.csvOutput = function(data, chrDelimiter){
	// for ObjectArray or ArrayArray only
	if ( !Array.isArray( data )) return;
	if (  data.length === 0 ) return;

	// is data ObjectArray or ArrayArray  TODO requires more strict examination
	var flgArrayArray = ( Array.isArray(data[0] ) );

	// switch function on type
	if ( flgArrayArray ) {
		return outputArrayArray(data, chrDelimiter);
	}else {
		return outputObjectArray(data, chrDelimiter);
	}

	// inner functions -----------------------
	function outputArrayArray(data, chrDelimiter){
		var strTemp = '';
		data.forEach(function(row){
			strTemp += row.join(chrDelimiter) + '\n';
		});
		return strTemp;
	}
	function outputObjectArray(data, chrDelimiter){
		var strTemp = '';
		// get HeadLines based on firstRow data keys
		var keys = Object.keys(data[0]);

		// output HeadLines
		strTemp += keys.join(chrDelimiter) + '\n';

		// output each item on each row
		data.forEach(function(row){
			keys.forEach(function(key, id , arr){
				strTemp += row[key];
				strTemp += (id < arr.length -1 ) ? chrDelimiter : '\n'
			});
		});
		return strTemp;
	}
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
          //  配列　配列のいずれかに等しい
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
    // // 編集用のデータを用意
    // var tempData = this.data;
    //
    // // 検索指定があれば対象行をしぼる
    // if (findLabel && findValue){
    //   tempData = tempData.filter(function(element, index, array){
    //     return element[findLabel] === findValue;
    //   })
    // }
    return new this.constructor(tempData);
  };

  dataHandle.ObjectArray.prototype.sortRow = function( sortLabel, isAscend){
    // データの対象
    var tempData = this.data;

    // 昇降フラグを整理する
    if (isAscend === undefined ) isAscend = true;
    var flag =  ( isAscend ) ? 1 : -1 ;

    // ソートする
    tempData.sort(function(v1, v2){
      // 数値
      return (v1[sortLabel] - v2[sortLabel]) * flag;
      // // 文字列
      // if (v1[sortLabel] < v2[sortLabel]){
      //   return -1 * flag;
      // }else {
      //   return  1 * flag;
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
  };

// =======================================================
// ArrayArray Class
// =======================================================
  dataHandle.ArrayArray = function(data){
    this.data = data;
  };

  // 指定フィールドが特定の値をとる行のみ取得する
  dataHandle.ArrayArray.prototype.filterRow = function(filterId, filterValue){
      var tempArr = this.data;
      if ( !element[filterId]) return;
      tempArr = tempArr.filter(function(element){
          return element[filterId]==filterValue;
      });
      return new this.constructor(tempArr);
  }
  //該当する行の指定フィールドを配列として取得する
  dataHandle.ArrayArray.prototype.getList = function(findId, isUnique, filterId, filterValue){
      var temp = this;
      // フィルタがあればフィルタをかける
      if (filterId && filterValue){
        temp = this.filterRow(filterId, filterValue);
      }

      // 指定のＩＤの行をとりだす
      tempArr = temp.data.map(function(element){
          return element[findId];
      });
      // ユニークフラグがあれば一意のデータのみにする
      if(isUnique){
          tempArr = tempArr.filter(function(element, index, array){
              return array.indexOf(element) == index;
          });
      }
      return tempArr;
  }
