import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CalendarViewProvider } from '../CalendarViewProvider';

suite('CalendarViewProvider Tests', () => {
    let provider: CalendarViewProvider;
    let extensionUri: vscode.Uri;
    let getNotesByDateStub: sinon.SinonStub;

    setup(() => {
        // Create stubs and mock data
        extensionUri = vscode.Uri.parse('file:///fake/path');
        getNotesByDateStub = sinon.stub().returns(new Map());

        // Create test instance with the required parameters
        provider = new CalendarViewProvider(extensionUri, getNotesByDateStub);
    });

    test('CalendarViewProvider should initialize correctly', () => {
        assert.strictEqual(provider instanceof CalendarViewProvider, true, 'Provider should be an instance of CalendarViewProvider');
        assert.strictEqual(typeof provider.resolveWebviewView, 'function', 'Should have resolveWebviewView method');
    });

    test('highlightDateInCalendar should send message to webview', async () => {
        // Setup
        const sendMessageStub = sinon.stub();

        // Simulate the webview
        const mockWebview = {
            postMessage: sendMessageStub,
            onDidReceiveMessage: () => { return { dispose: () => { } }; },
            html: '',
            options: {},
            asWebviewUri: (uri: vscode.Uri) => uri,
            cspSource: '',
        };

        // @ts-ignore - We're only using a subset of the properties for testing
        provider['_view'] = { webview: mockWebview };

        // Act
        provider.highlightDateInCalendar('2023-05-15');

        // Assert
        assert.strictEqual(sendMessageStub.calledOnce, true, 'Should call postMessage once');
        assert.deepStrictEqual(
            sendMessageStub.firstCall.args[0],
            { command: 'highlightDate', date: '2023-05-15' },
            'Should send the correct message data'
        );
    });
});
