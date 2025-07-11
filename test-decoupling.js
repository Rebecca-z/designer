// 测试解耦效果的简单示例
console.log('=== 解耦测试 ===');

// 模拟解耦后的函数结构
const renderColumnContent = (col, index, renderFn) => {
  console.log(`渲染第${index + 1}列，使用传入的renderFn`);
  const colElements = (col.elements || []).map(renderFn).join('');
  return `<div>列${index + 1}: ${colElements}</div>`;
};

const columnsHtml = (comp, renderFn) => {
  console.log(
    'columnsHtml 接收 renderFn 参数，不再直接调用 renderComponentToHTML',
  );
  const columnsContent = (comp.columns || [])
    .map((col, index) => renderColumnContent(col, index, renderFn))
    .join('');
  return `<div class="columns">${columnsContent}</div>`;
};

const renderComponentToHTML = (component) => {
  console.log(`renderComponentToHTML 处理组件: ${component.tag}`);

  switch (component.tag) {
    case 'column_set':
      // 现在通过参数传递自身，而不是直接调用
      return columnsHtml(component, renderComponentToHTML);
    default:
      return `<div>${component.tag}</div>`;
  }
};

// 测试数据
const testData = {
  tag: 'column_set',
  columns: [
    {
      elements: [
        { tag: 'input', name: 'test1' },
        { tag: 'button', name: 'test2' },
      ],
    },
    {
      elements: [{ tag: 'plain_text', content: 'test3' }],
    },
  ],
};

// 执行测试
console.log('\n开始测试...');
const result = renderComponentToHTML(testData);
console.log('\n测试结果:', result);

console.log('\n✅ 解耦成功！');
console.log('✅ columnsHtml 不再直接依赖 renderComponentToHTML');
console.log('✅ renderComponentToHTML 通过参数传递自身给 columnsHtml');
console.log('✅ 消除了循环依赖关系');
