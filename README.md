# Vue Fast Script

一个 VSCode 扩展，帮助 Vue3 开发者快速生成 `<script setup>` 中变量和函数。使用 正则 提取模板中的变量和事件。

目前只支持从模板中的插值和事件生成变量和函数。

全程使用 `Cursor` 编辑器编写。

灵感来自 [fast-create-variable](https://github.com/Simon-He95/fast-create-variable), `fast-create-variable` 更加强大，推荐使用。



## 功能特点

- 🚀 快速生成 Vue 3（仅支持 `<script setup>`）的 `<script setup>` 中变量和函数
- 🎯 自动识别模板中的变量和事件
- 🔄 智能更新现有的 script 内容
- ⚡️ 支持 TypeScript
- 🚫 不支持 Vue2

## 使用方法

1. 在 `.vue` 文件中双击选中模板中的变量名或事件名
2. 快捷键 `Ctrl+G` 或者 运行命令 `vue-fast-script.generate`
3. 自动生成对应的 script 中变量或者函数

### 示例
```vue
<script setup lang="ts">

const username = ref('');

function handleSubmit() {
// TODO: implement handleSubmit
}
</script>
</script>
<template>
  <div>
    <input v-model="username" />
    <button @click="handleSubmit">button</button>
  </div>
</template>
```

