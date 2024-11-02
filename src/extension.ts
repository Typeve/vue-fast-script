import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// 注册命令
	const disposable = vscode.commands.registerCommand('vue-fast-script.generate', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || !editor.document.fileName.endsWith('.vue')) {
			vscode.window.showInformationMessage('请在 Vue 文件中使用此命令');
			return;
		}

		const document = editor.document;
		const fullText = document.getText();
		
		// 检查是否是 Vue 3 文件
		if (!isVue3File(fullText)) {
			vscode.window.showErrorMessage('此扩展仅支持 Vue 3 setup 语法');
			return;
		}

		const selection = editor.selection;
		const selectedText = document.getText(selection);
		
		// 传入完整文本以检查上下文
		const variables = extractVariables(selectedText, fullText);
		const events = extractEvents(selectedText, fullText);
		
		// 如果没有找到变量和事件，显示提示
		if (variables.length === 0 && events.length === 0) {
			vscode.window.showInformationMessage('在选中的文本中没有找到变量或事件');
			return;
		}

		// 生成 script 内容
		const scriptContent = generateScriptContent(variables, events);
		
		// 插入或更新 script 部分
		updateScript(editor, scriptContent);
	});

	context.subscriptions.push(disposable);
}

function extractVariables(text: string, fullText: string): string[] {
	const variables = new Set<string>();
	const variableName = text.trim();
	
	// 检查选中文本是否在事件属性中
	const eventPattern = new RegExp(`@\\w+="${variableName}"`, 'g');
	const isEvent = eventPattern.test(fullText);
	
	// 如果不是事件且是合法的变量名，则添加为变量
	if (!isEvent && /^\w+$/.test(variableName)) {
		variables.add(variableName);
	}
	
	return Array.from(variables);
}

function extractEvents(text: string, fullText: string): string[] {
	const events = new Set<string>();
	const eventName = text.trim();
	
	// 检查选中文��是否在事件属性中
	const eventPattern = new RegExp(`@\\w+="${eventName}"`, 'g');
	const isEvent = eventPattern.test(fullText);
	
	// 如果是事件且是合法的方法名，则添加为事件
	if (isEvent && /^\w+$/.test(eventName)) {
		events.add(eventName);
	}
	
	return Array.from(events);
}

function generateScriptContent(variables: string[], events: string[]): string {
	let content = `<script setup lang="ts">\n`;
	
	// 生成变量定义
	variables.forEach(variable => {
		content += `const ${variable} = ref('');\n`;
	});
	
	// 生成事件方法，使用 function 声明
	events.forEach(event => {
		content += `\nfunction ${event}() {\n  // TODO: implement ${event}\n}\n`;
	});
	
	content += `</script>`;
	return content;
}

// 添加一个显示临时消息的辅助函数
async function showTemporaryMessage(message: string, duration: number = 1500): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false
    }, async (progress) => {
        await new Promise(resolve => setTimeout(resolve, duration));
    });
}

function updateScript(editor: vscode.TextEditor, scriptContent: string) {
    const document = editor.document;
    const text = document.getText();
    const scriptRegex = /<script\b[^>]*>[\s\S]*?<\/script>/;
    const scriptMatch = text.match(scriptRegex);

    if (!scriptMatch) {
        // 如果没有 script 标签，直接添加新内容
        const position = new vscode.Position(document.lineCount, 0);
        editor.edit(editBuilder => {
            editBuilder.insert(position, '\n' + scriptContent);
        });
        showTemporaryMessage('新的 Script 已添加');
        return;
    }

    // 提前检查是否需要更新
    const existingScript = scriptMatch[0];
    const existingVars = new Set<string>();
    const existingMethods = new Set<string>();
    
    // 提取现有的变量和方法名
    const varRegex = /const\s+(\w+)\s*=/g;
    const methodRegex = /function\s+(\w+)\s*\(/g;
    let match;
    
    while ((match = varRegex.exec(existingScript)) !== null) {
        existingVars.add(match[1]);
    }
    while ((match = methodRegex.exec(existingScript)) !== null) {
        existingMethods.add(match[1]);
    }

    // 从新内容中提取变量和事件
    const newVars: string[] = [];
    const newEvents: string[] = [];
    
    while ((match = varRegex.exec(scriptContent)) !== null) {
        newVars.push(match[1]);
    }
    while ((match = methodRegex.exec(scriptContent)) !== null) {
        newEvents.push(match[1]);
    }

    // 过滤掉已存在的变量和方法
    const uniqueVars = newVars.filter(v => !existingVars.has(v));
    const uniqueEvents = newEvents.filter(e => !existingMethods.has(e));
    
    // 如果没有新的内容需要添加，直接返回
    if (uniqueVars.length === 0 && uniqueEvents.length === 0) {
        showTemporaryMessage('所选内容已经在脚本中定义');
        return;
    }

    // 显示将要添加的内容
    if (uniqueVars.length > 0) {
        showTemporaryMessage(`新增变量：${uniqueVars.join(', ')}`);
    }
    if (uniqueEvents.length > 0) {
        showTemporaryMessage(`新增方法：${uniqueEvents.join(', ')}`);
    }

    // 只有在确实需要更新时才执行编辑操作
    editor.edit(editBuilder => {
        const startPos = document.positionAt(scriptMatch.index!);
        const endPos = document.positionAt(scriptMatch.index! + scriptMatch[0].length);
        const range = new vscode.Range(startPos, endPos);
        
        // 生成新内容
        let content = existingScript.replace('</script>', '');
        uniqueVars.forEach(variable => {
            content += `\nconst ${variable} = ref('');`;
        });
        uniqueEvents.forEach(event => {
            content += `\n\nfunction ${event}() {\n  // TODO: implement ${event}\n}`;
        });
        content += '\n</script>';
        
        editBuilder.replace(range, content);
    });
    
    showTemporaryMessage('Script 已更新');
}

export function deactivate() {}

// 添加新的辅助函数来检查是否是 Vue 3 文件
function isVue3File(content: string): boolean {
	// 检查是否使用 <script setup> 语法
	const hasScriptSetup = /<script\s+setup\b/i.test(content);
	if (hasScriptSetup) {return true;}

	// 检查是否导入了 Vue 3 特定的 API
	const hasVue3Imports = /from\s+['"]vue['"]/i.test(content) && 
		(/\b(ref|reactive|computed|watch|onMounted)\b/.test(content) ||
		 /\bdefineComponent\b/.test(content));

	// 检查是否使用了 Composition API
	const hasCompositionAPI = /setup\(\s*\)\s*{/.test(content);

	return hasVue3Imports || hasCompositionAPI;
}
