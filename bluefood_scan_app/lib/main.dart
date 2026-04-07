import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';

const String defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://192.168.130.68:5085',
);

void main() {
  runApp(const BlueFoodScanApp());
}

class BlueFoodScanApp extends StatelessWidget {
  const BlueFoodScanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BlueFood Scanner',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.teal),
      home: const ScannerPage(),
    );
  }
}

class TraceEvent {
  TraceEvent({
    required this.eventNo,
    required this.eventType,
    required this.productName,
    required this.eventTime,
    required this.batchCode,
    this.fromPartnerName,
    this.toPartnerName,
    this.locationText,
    this.noteText,
  });

  final int eventNo;
  final String eventType;
  final String productName;
  final String eventTime;
  final String batchCode;
  final String? fromPartnerName;
  final String? toPartnerName;
  final String? locationText;
  final String? noteText;

  factory TraceEvent.fromJson(Map<String, dynamic> json) {
    return TraceEvent(
      eventNo: (json['eventNo'] ?? 0) as int,
      eventType: (json['eventType'] ?? '') as String,
      productName: (json['productName'] ?? '') as String,
      eventTime: (json['eventTime'] ?? '') as String,
      batchCode: (json['batchCode'] ?? '') as String,
      fromPartnerName: json['fromPartnerName'] as String?,
      toPartnerName: json['toPartnerName'] as String?,
      locationText: json['locationText'] as String?,
      noteText: json['noteText'] as String?,
    );
  }
}

class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key});

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> {
  final MobileScannerController _controller = MobileScannerController(
    formats: [BarcodeFormat.qrCode],
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _busy = false;
  String _status = 'Ready to scan';
  String? _lastRaw;
  String? _lastToken;
  String? _lastPublicUrl;
  List<TraceEvent> _events = <TraceEvent>[];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy || capture.barcodes.isEmpty) {
      return;
    }

    final String? raw = capture.barcodes.first.rawValue;
    if (raw == null || raw.trim().isEmpty) {
      return;
    }

    final String cleaned = raw.trim();
    final String? token = _extractToken(cleaned);

    setState(() {
      _busy = true;
      _status = token == null ? 'QR content is not valid for BlueFood.' : 'Loading trace...';
      _lastRaw = cleaned;
      _lastToken = token;
      _events = <TraceEvent>[];
      _lastPublicUrl = _toPublicUrl(cleaned, token);
    });

    if (token == null) {
      setState(() {
        _busy = false;
      });
      return;
    }

    try {
      final Uri url = Uri.parse(
        '$defaultApiBaseUrl/api/trace/${Uri.encodeComponent(token)}',
      );

      final http.Response response = await http.get(url);
      if (response.statusCode != 200) {
        setState(() {
          _status = 'API error: ${response.statusCode}';
          _busy = false;
        });
        return;
      }

      final dynamic decoded = jsonDecode(response.body);
      if (decoded is! List) {
        setState(() {
          _status = 'Unexpected response format.';
          _busy = false;
        });
        return;
      }

      final List<TraceEvent> events = decoded
          .whereType<Map<String, dynamic>>()
          .map(TraceEvent.fromJson)
          .toList(growable: false);

      setState(() {
        _events = events;
        _status = events.isEmpty ? 'No trace found for this token.' : 'Loaded ${events.length} trace events.';
        _busy = false;
      });
    } catch (error) {
      setState(() {
        _status = 'Failed to load trace: $error';
        _busy = false;
      });
    }
  }

  static String? _extractToken(String raw) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      final Uri uri = Uri.tryParse(raw) ?? Uri();
      final List<String> segments = uri.pathSegments.where((s) => s.isNotEmpty).toList(growable: false);

      if (segments.length >= 2 && segments[0] == 't') {
        return segments[1];
      }

      if (segments.length >= 3 && segments[0] == 'trace' && segments[1] == 'public') {
        return segments[2];
      }

      if (segments.length >= 3 && segments[0] == 'api' && segments[1] == 'trace') {
        return segments[2];
      }

      return null;
    }

    final RegExp tokenPattern = RegExp(r'^[A-Za-z0-9_-]{12,}$');
    if (tokenPattern.hasMatch(raw)) {
      return raw;
    }

    return null;
  }

  static String? _toPublicUrl(String raw, String? token) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    if (token == null) {
      return null;
    }
    return '$defaultApiBaseUrl/t/${Uri.encodeComponent(token)}';
  }

  Future<void> _openPublicUrl() async {
    final String? url = _lastPublicUrl;
    if (url == null) {
      return;
    }

    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      setState(() {
        _status = 'Could not open URL: $url';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BlueFood QR Scanner'),
        actions: [
          IconButton(
            onPressed: _busy
                ? null
                : () {
                    setState(() {
                      _lastRaw = null;
                      _lastToken = null;
                      _lastPublicUrl = null;
                      _events = <TraceEvent>[];
                      _status = 'Ready to scan';
                    });
                  },
            icon: const Icon(Icons.refresh),
            tooltip: 'Clear',
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: MobileScanner(
              controller: _controller,
              onDetect: _onDetect,
            ),
          ),
          Expanded(
            flex: 5,
            child: Container(
              width: double.infinity,
              color: Colors.black.withOpacity(0.04),
              padding: const EdgeInsets.all(16),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Status: $_status'),
                    const SizedBox(height: 8),
                    if (_lastToken != null) Text('Token: $_lastToken'),
                    if (_lastRaw != null) ...[
                      const SizedBox(height: 4),
                      Text('Raw QR: $_lastRaw'),
                    ],
                    const SizedBox(height: 8),
                    if (_lastPublicUrl != null)
                      OutlinedButton.icon(
                        onPressed: _openPublicUrl,
                        icon: const Icon(Icons.open_in_new),
                        label: const Text('Open Public Trace URL'),
                      ),
                    const SizedBox(height: 12),
                    const Text(
                      'Trace Timeline',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    if (_events.isEmpty)
                      const Text('No trace data yet.')
                    else
                      ..._events.map(
                        (event) => Card(
                          child: ListTile(
                            title: Text('#${event.eventNo} ${event.eventType}'),
                            subtitle: Text(
                              '${event.productName}\n${event.eventTime}\n${event.fromPartnerName ?? '-'} -> ${event.toPartnerName ?? '-'}',
                            ),
                            isThreeLine: true,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
