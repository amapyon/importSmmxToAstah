importPackage(com.change_vision.jude.api.inf.model);
importPackage(com.change_vision.jude.api.inf.editor);

importPackage(org.w3c.dom);
importPackage(org.xml.sax);
importPackage(javax.xml.parsers);

importPackage(javax.swing);
importPackage(java.io);

function selectSmmxFile() {
	var chooser = new JFileChooser();
	var selected = chooser.showSaveDialog(scriptWindow);
	if (selected == JFileChooser.APPROVE_OPTION) {
		var file = chooser.getSelectedFile();
		if (file.getName().toLowerCase().endsWith('.smmx')) {
			return file;
		} else {
			return new File(file.getAbsolutePath() + '.smmx');
		}
	} else {
		return null;
	}
}

function getFileUri() {
	var filename = selectSmmxFile();
	if (filename == null) return null;
	return filename.toURL();
}

function createDom(fileUri) {
	var docBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
	var dom = docBuilder.parse(fileUri);
	return dom;
}

function createTopicTree(dom) {
	var topicsList = dom.getElementsByTagName("topics");
	//println(topicsList.getLength());
	
	var idxId = [];
	var idxParent = []
	var root;
	var attrs;
	
	var topic = topicsList.item(0).getElementsByTagName("topic");
	for (var i = 0; i < topic.getLength(); i++) {
		attrs = topic.item(i).getAttributes();
		var id = getInt('id');
		var parent = getInt('parent');
		var text = getString('text');
//		println('[' + id + ', ' + parent + ', ' + text + ']');
		idxId[id] = text;
		if (parent == -1) {
			root = id;
		} else {
			if (typeof idxParent[parent] == 'undefined') {
				idxParent[parent] = [];
			}
			idxParent[parent].push(id);
		}
	}
	
	return {idxId: idxId, idxParent: idxParent, root: root}
	
	function getString(name) {
		return attrs.getNamedItem(name).getValue();
	}
	
	function getInt(name) {
		return parseInt(getString(name));
	}
	
}

function createMindMap(tree) {
	var diagramName = tree.idxId[tree.root];
	var mme = astah.getDiagramEditorFactory().getMindmapEditor();

	TransactionManager.beginTransaction();
	var diagram = createMindMapDiagram(diagramName);
	TransactionManager.endTransaction();

	createTopics();

	function createTopics() {
		var rootNode = diagram.getRoot();
		createTopic(rootNode, tree.root);
	}
	
	function createTopic(parentNode, parentId) {
		if (typeof tree.idxParent[parentId] == 'undefined') {
			return;
		}
	
		println(tree.idxParent[parentId]);
		println(typeof tree.idxParent[parentId]);
	
		for (var i = 0; i < tree.idxParent[parentId].length; i++) {
			var nodeId = tree.idxParent[parentId][i];

			TransactionManager.beginTransaction();
			var node = mme.createTopic(parentNode, tree.idxId[nodeId]);
			TransactionManager.endTransaction();
			
			
			createTopic(node, nodeId);
		}
	}

	function createMindMapDiagramName(diagramName) {
		var result = astah.findElements(IMindMapDiagram, diagramName);
		if (result.length == 0) {
			return diagramName;
		}
		return createMindMapDiagramName(diagramName + '_0');
	}
	
	function createMindMapDiagram(diagramName) {
		var mindMapDiagramName = createMindMapDiagramName(diagramName);
		return mme.createMindmapDiagram(astah.project, mindMapDiagramName);
	}
}

function run() {

	var fileUri = getFileUri();
	if (fileUri == null) return;
	
	var dom = createDom(fileUri);
	var tree = createTopicTree(dom);
//	dump(tree.idxId[tree.root]);
//	dumpArray(tree.idxParent);

	createMindMap(tree);

}

var indent = 0;
function printNodeTree(node) {
	indent++;
	printIndent();
	println(node);
	printAttributes(node);
	var nodeList = node.getChildNodes();
	for(var i = 0; i < nodeList.getLength(); i++) {
		printNodeTree(nodeList.item(i));
	}
	indent--;
}

function printAttributes(node) {
	var attributeMap = node.getAttributes();
	if (attributeMap == null) return;

//	for (o in attributeMap) {
//		println(o);
//	}
	
	for (var i = 0; i < attributeMap.getLength(); i++) {
		printIndent();
		println(attributeMap.item(i));
	}
}

function printIndent() {
	for (var i = 0; i < indent; i++) {
		print('  ');
	}
}

function dumpArray(array) {
	println('---------------');
	for (var i = 0; i < array.length; i++) {
		println(i + '[' + array[i] + ']');
	}
}

function dump(obj) {
    println('---------------');
    print(typeof obj);
    print('=>');
    println(obj);

    for (o in obj) {
        print('  ');
        print(typeof o);
        print('=>');
        println(o);
    }
}


run();
