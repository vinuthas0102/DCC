import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { ROUTES } from '../constants/routes';

export const PaymentGatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [simulateSuccess, setSimulateSuccess] = useState(true);
  const [processing, setProcessing] = useState(false);

  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');
  const returnUrl = searchParams.get('returnUrl') || ROUTES.LANDING;

  useEffect(() => {
    if (!bookingId || !amount) {
      navigate(ROUTES.LANDING);
    }
  }, [bookingId, amount, navigate]);

  const handlePayment = async () => {
    setProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const transaction = await paymentService.processPayment(
        bookingId!,
        parseFloat(amount || '0'),
        simulateSuccess
      );

      const resultParams = new URLSearchParams({
        success: simulateSuccess.toString(),
        transactionId: transaction.transactionId,
        bookingId: bookingId || '',
      });

      navigate(`${returnUrl}?${resultParams.toString()}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      const resultParams = new URLSearchParams({
        success: 'false',
        transactionId: 'ERROR',
        bookingId: bookingId || '',
      });
      navigate(`${returnUrl}?${resultParams.toString()}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">IBL-ATOM Payment Gateway</h1>
          <p className="text-sm text-gray-600">Secure Payment Processing (Test Mode)</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Booking ID:</span>
            <span className="text-sm font-mono font-semibold text-gray-900">{bookingId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-2xl font-bold text-gray-900">₹{parseFloat(amount || '0').toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-900 mb-3">Test Mode Configuration</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-800">Simulate Payment Result:</span>
            <div className="flex gap-2">
              <Button
                variant={simulateSuccess ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSimulateSuccess(true)}
                disabled={processing}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Success
              </Button>
              <Button
                variant={!simulateSuccess ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSimulateSuccess(false)}
                disabled={processing}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Failure
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              placeholder="4111 1111 1111 1111"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={processing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={processing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={processing}
            />
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full mt-6"
        >
          {processing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ₹{parseFloat(amount || '0').toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          This is a simulated payment gateway for testing purposes only.
          No real transactions are processed.
        </p>
      </Card>
    </div>
  );
};
