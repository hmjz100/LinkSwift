// let callCounter = 0; // 全局计数器

// async function getFilesByOnce(file) {
//     // 每调用50次暂停3秒
//     if (callCounter >= 50) {
//         console.log('已调用50次，暂停3秒...');
//         await new Promise(resolve => setTimeout(resolve, 3000)); // 暂停3秒
//         callCounter = 0; // 重置计数器
//     }

//     console.log(`防反爬计数器： ${callCounter}`);
//     callCounter++; // 增加计数器

//     // 这里模拟获取文件的操作
//     // 实际操作可能包括网络请求等异步任务
//     // 返回文件数据或链接
//     return `链接: ${file}`;
// }

// // 创建一个异步迭代器，模拟动态生成文件
// async function* fileGenerator(totalFiles) {
//     let index = 0;
//     while (index < totalFiles) {
//         // 模拟异步生成文件
//         await new Promise(resolve => setTimeout(resolve, 100));
//         yield `file ${index++}`;
//     }
// }

// async function processFilesWithLimit(fileIterator, limit) {
//     const executing = new Set();
//     const results = [];

//     for await (const file of fileIterator) {
//         const result = getFilesByOnce(file);
//         results.push(result);
//         executing.add(result);

//         if (executing.size >= limit) {
//             await Promise.race(executing);
//         }

//         // 当一个文件处理完毕后，从执行集合中移除
//         executing.delete(result);
//     }

//     // 等待所有剩余的文件处理完毕
//     await Promise.all(executing);
//     return results;
// }

// (async () => {
//     const totalFiles = 500; // 总文件数
//     const limit = 10; // 并发限制

//     // 创建文件迭代器
//     const files = fileGenerator(totalFiles);

//     // 使用并发限制处理所有文件
//     const results = await processFilesWithLimit(files, limit);

//     console.log('所有文件处理完毕', results);
// })();