/**
 * 冒泡排序算法
 * 时间复杂度: O(n²)
 * 空间复杂度: O(1)
 * 稳定性: 稳定
 */

// 基础冒泡排序
function bubbleSort(arr) {
  const len = arr.length;

  // 外层循环控制排序轮数
  for (let i = 0; i < len - 1; i++) {
    // 内层循环进行相邻元素比较和交换
    for (let j = 0; j < len - 1 - i; j++) {
      // 如果前一个元素大于后一个元素，则交换它们
      if (arr[j] > arr[j + 1]) {
        // 使用解构赋值进行交换
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }

  return arr;
}

// 优化版冒泡排序（添加标志位，如果一轮中没有交换，说明已经有序）
function optimizedBubbleSort(arr) {
  const len = arr.length;

  for (let i = 0; i < len - 1; i++) {
    let swapped = false; // 标志位，记录本轮是否发生交换

    for (let j = 0; j < len - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }

    // 如果本轮没有发生交换，说明数组已经有序，可以提前退出
    if (!swapped) {
      break;
    }
  }

  return arr;
}

// 测试代码
function testBubbleSort() {
  console.log('=== 冒泡排序测试 ===');

  // 测试用例
  const testCases = [
    [64, 34, 25, 12, 22, 11, 90],
    [5, 2, 4, 6, 1, 3],
    [1],
    [],
    [3, 3, 3, 3],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n测试用例 ${index + 1}:`);
    console.log('原始数组:', [...testCase]);

    // 测试基础版本
    const result1 = bubbleSort([...testCase]);
    console.log('基础冒泡排序结果:', result1);

    // 测试优化版本
    const result2 = optimizedBubbleSort([...testCase]);
    console.log('优化冒泡排序结果:', result2);
  });
}

// 性能对比测试
function performanceTest() {
  console.log('\n=== 性能对比测试 ===');

  // 生成随机数组
  const generateRandomArray = (size) => {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
  };

  const testSizes = [100, 500, 1000];

  testSizes.forEach((size) => {
    const arr = generateRandomArray(size);

    console.log(`\n数组大小: ${size}`);

    // 测试基础版本
    const start1 = performance.now();
    bubbleSort([...arr]);
    const end1 = performance.now();
    console.log(`基础冒泡排序耗时: ${(end1 - start1).toFixed(2)}ms`);

    // 测试优化版本
    const start2 = performance.now();
    optimizedBubbleSort([...arr]);
    const end2 = performance.now();
    console.log(`优化冒泡排序耗时: ${(end2 - start2).toFixed(2)}ms`);
  });
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = { bubbleSort, optimizedBubbleSort };
} else {
  // 浏览器环境
  testBubbleSort();
  performanceTest();
}

// 导出函数供其他模块使用
export { bubbleSort, optimizedBubbleSort };
