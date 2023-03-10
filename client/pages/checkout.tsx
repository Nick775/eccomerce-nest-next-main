import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Image,
  Input,
  Radio,
  Row,
  Spacer,
  Text,
  Textarea,
} from '@nextui-org/react';
import axios from 'axios';
import { unstable_getServerSession } from 'next-auth/next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next/types';
import { useEffect, useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
} from 'react-hook-form';
import Swal from 'sweetalert2';
import MySelect from '../components/common/MySelect';
import UserLayout from '../components/common/UserLayout';
import useAuthUser from '../libs/hooks/useAuthUser';
import useMediaQuery from '../libs/hooks/useMediaQuery';
import {
  clearCart,
  selectCart,
  updateCart,
} from '../libs/redux/reducers/cartReducer';
import { useAppDispatch, useAppSelector } from '../libs/redux/store';
import { useCities } from '../libs/swr/useCities';
import { CartItemType, CityType, DistrictType, WardType } from '../types';
import { options } from './api/auth/[...nextauth]';
import { CustomCartItemType, useCheckVariantIds } from './cart';

const findAmount = (variantId: number, cart: CartItemType[]) => {
  const amount = cart.find((c) => c.variantId === variantId)?.quantity;
  return amount || 0;
};

const totalPrice = (cart: CustomCartItemType[]) =>
  cart?.reduce((prev: number, curr: CustomCartItemType) => {
    return prev + curr.amountInCart * curr.price;
  }, 0);

const Summary = () => {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const ids = cart.map((i) => i.variantId);
  const { data } = useCheckVariantIds(ids);
  const [shipCost, setShipCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const { watch } = useFormContext(); // retrieve all hook methods
  const fullName = watch('fullName');
  const phone = watch('phone');
  const address = watch('address');
  const city = watch('city');
  const district = watch('district');
  const ward = watch('ward');

  const cartItems: CustomCartItemType[] = useMemo(() => {
    const items = data?.map((d) => {
      const amountInCart = findAmount(d.id, cart);
      return { amountInCart, ...d };
    });

    return items || [];
  }, [data, cart]);

  const disabled =
    fullName &&
    phone &&
    address &&
    city &&
    district &&
    ward &&
    cartItems.length > 0;

  // Track the product is still visible or not
  // If not -> update cart
  useEffect(() => {
    if (data) {
      const ids = data?.map((i) => i.id);
      dispatch(updateCart({ ids }));
    }
  }, [data]);

  return (
    <Card>
      <Card.Header css={{ columnGap: 5 }}>
        <div className='order-number'>3</div>
        <Text b size={24} color='secondary'>
          Th??ng tin gi??? h??ng
        </Text>
      </Card.Header>

      <Card.Body>
        <div>
          {cartItems.length > 0 ? (
            cartItems.map((cartItem) => (
              <Row
                key={cartItem.id}
                css={{ columnGap: 15, mb: 25 }}
                align='center'
              >
                <Badge
                  color='secondary'
                  content={cartItem.amountInCart}
                  shape='rectangle'
                  size='md'
                >
                  <Image
                    width={40}
                    height={40}
                    alt=''
                    src={cartItem.product?.images[0].url || ''}
                  />
                </Badge>
                <div>
                  <Text
                    css={{
                      lineHeight: 1,
                      fontWeight: 500,
                      color: '$gray900',
                    }}
                    size={14}
                  >
                    {cartItem.product?.name}
                  </Text>
                  <Text color='$accents7' b css={{ lineHeight: 1 }} size={13}>
                    <Text
                      b
                      size={13}
                      css={{
                        color: '$accents7',
                      }}
                    >
                      {cartItem.attributeValues.length > 0 &&
                        cartItem.attributeValues.map(
                          (i, index, arr) =>
                            (index ? ', ' : '') +
                            i.value +
                            (index + 1 === arr.length ? ' - ' : '')
                        )}
                      {cartItem.price.toLocaleString('vi-VN')} ??
                    </Text>
                  </Text>
                </div>
              </Row>
            ))
          ) : (
            <>
              <Text color='error'>Kh??ng c?? s???n ph???m</Text>
              <Spacer y={1} />
            </>
          )}
        </div>

        <div>
          <Row css={{ columnGap: 5 }} align='flex-end'>
            <Input
              fullWidth
              label='M?? gi???m gi??'
              placeholder='Nh???p m?? gi???m gi??'
            />
            <Button auto flat color='secondary'>
              ??p d???ng
            </Button>
          </Row>
          <Spacer y={1} />
          <Row css={{ mb: 5 }} justify='space-between'>
            <Text css={{ color: '$accents9' }}>T???ng:</Text>
            <Text css={{ color: '$accents9' }}>
              {totalPrice(cartItems)?.toLocaleString('vi-VN')} ??
            </Text>
          </Row>
          <Row css={{ mb: 5 }} justify='space-between'>
            <Text css={{ color: '$accents9' }}>Ph?? v???n chuy???n:</Text>
            <Text css={{ color: '$accents9' }}>{shipCost} ??</Text>
          </Row>
          <Row css={{ mb: 5 }} justify='space-between'>
            <Text css={{ color: '$accents9' }}>Gi???m:</Text>
            <Text css={{ color: '$accents9' }}>{discount} ??</Text>
          </Row>
          <Spacer y={1} />
          <Card.Divider />
          <Spacer y={1} />
          <Row justify='space-between'>
            <Text size={18} b color='secondary'>
              C???n thanh to??n:
            </Text>

            <Text size={18} b color='secondary'>
              {(totalPrice(cartItems) + shipCost - discount)?.toLocaleString(
                'vi-VN'
              )}{' '}
              ??
            </Text>
          </Row>

          <Row css={{ mt: 20 }}>
            <Button
              css={{ w: '100%' }}
              shadow
              color='secondary'
              size='md'
              type='submit'
              disabled={!disabled}
            >
              ?????t h??ng
            </Button>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

const Payment = () => {
  const { control } = useFormContext(); // retrieve all hook methods

  return (
    <Card>
      <Card.Header css={{ columnGap: 5 }}>
        <div className='order-number'>2</div>
        <Text b size={24} color='secondary'>
          Ph????ng th???c thanh to??n
        </Text>
      </Card.Header>
      <Card.Body>
        <Controller
          name='paymentMethod'
          control={control}
          defaultValue='COD'
          render={({ field: { onChange, value, ref } }) => (
            <Radio.Group
              onChange={onChange}
              value={value}
              aria-labelledby='paymentMethod'
              ref={ref}
            >
              <Radio color='secondary' value='COD' size='xs' type='radio'>
                Tr??? ti???n m???t khi nh???n h??ng (COD)
              </Radio>
              <Radio color='secondary' value='ZALOPAY' size='xs'>
                Thanh to??n qua Zalo Pay
              </Radio>
              {/* <Radio color='secondary' value='MOMO' size='xs'>
                Thanh to??n qua Momo
              </Radio> */}
            </Radio.Group>
          )}
        />
      </Card.Body>
    </Card>
  );
};

const Info = () => {
  const { register, control, setValue } = useFormContext(); // retrieve all hook methods
  const { data: cities } = useCities();
  const [districts, setDistricts] = useState<DistrictType[]>([]);
  const [wards, setWards] = useState<WardType[]>([]);

  const citiesOption = cities?.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const wardsOption = wards?.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const districtsOption = districts?.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const handleChangeCity = async (
    onChange: (...event: any[]) => void,
    e: any
  ) => {
    try {
      onChange(e);
      const res = await axios.get<CityType>(
        'https://provinces.open-api.vn/api/p/' + e.value + '?depth=2'
      );
      setValue('district', null);
      setDistricts(res.data.districts);
      setValue('ward', null);
      setWards([]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChangeDistrict = async (
    onChange: (...event: any[]) => void,
    e: any
  ) => {
    try {
      onChange(e);
      const res = await axios.get<DistrictType>(
        'https://provinces.open-api.vn/api/d/' + e.value + '?depth=2'
      );
      setWards(res.data.wards);
      setValue('ward', null);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Card>
      <Card.Header css={{ columnGap: 5 }}>
        <div className='order-number'>1</div>
        <Text b size={24} color='secondary'>
          Th??ng tin ?????t h??ng
        </Text>
      </Card.Header>
      <Card.Body>
        <Grid.Container gap={1.2}>
          <Grid xs={12} sm={6} css={{ pt: 0 }}>
            <Input
              {...register('fullName', { required: true })}
              fullWidth
              label='H??? t??n'
              placeholder='Nh???p h??? t??n'
              color='default'
              clearable
              rounded={false}
            />
          </Grid>
          <Grid xs={12} sm={6} css={{ pt: 0 }}>
            <Input
              {...register('phone', { required: true, valueAsNumber: true })}
              fullWidth
              label='S??? ??i???n tho???i'
              placeholder='Nh???p s??? ??i???n tho???i'
              color='default'
              type='number'
            />
          </Grid>
          <Grid xs={12}>
            <Input
              {...register('address', { required: true })}
              fullWidth
              label='?????a ch???'
              placeholder='Nh???p ?????a ch???'
              color='default'
              clearable
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <Controller
              name='city'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <MySelect
                  placeholder='Ch???n th??nh ph???'
                  label='T???nh/ Th??nh ph???'
                  options={citiesOption}
                  value={field.value}
                  onChange={(e: any) => handleChangeCity(field.onChange, e)}
                  innerRef={field.ref}
                  minW={360}
                />
              )}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <Controller
              name='district'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <MySelect
                  placeholder='Ch???n Qu???n/Huy???n'
                  label='Qu???n/ Huy???n'
                  options={districtsOption}
                  value={field.value}
                  onChange={(e: any) => handleChangeDistrict(field.onChange, e)}
                  innerRef={field.ref}
                  minW={360}
                />
              )}
            />
          </Grid>
          <Grid xs={12}>
            <Controller
              name='ward'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <MySelect
                  placeholder='Ch???n Ph?????ng/X??'
                  label='Ph?????ng/ X??'
                  options={wardsOption}
                  value={field.value}
                  onChange={field.onChange}
                  innerRef={field.ref}
                  minW={360}
                />
              )}
            />
          </Grid>
          <Grid xs={12}>
            <Textarea
              {...register('note')}
              minRows={4}
              maxRows={4}
              placeholder='Ghi ch?? ????n h??ng...'
              fullWidth
              aria-label='note'
            />
          </Grid>
        </Grid.Container>
      </Card.Body>
    </Card>
  );
};

type FormValues = {
  fullName: string;
  phone: number;
  city: {
    value: number;
    label: string;
  };
  district: {
    value: number;
    label: string;
  };
  ward: {
    value: number;
    label: string;
  };
  address: string;
  note: string;
  paymentMethod: string;
  totalPrice: number;
};

export default function Checkout() {
  useAuthUser(true);
  const router = useRouter();
  const { data: session } = useSession();
  const methods = useForm<FormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const ids = cart.map((i: CartItemType) => i.variantId);
  const { data } = useCheckVariantIds(ids);
  const cartItems: CustomCartItemType[] = useMemo(() => {
    const items = data?.map((d) => {
      const amountInCart = findAmount(d.id, cart);
      return { amountInCart, ...d };
    });

    return items || [];
  }, [data, cart]);
  const isXs = useMediaQuery('(min-width: 650px)');

  useEffect(() => {
    if (session === null) {
      router.push('/');
    }
  }, [session]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const { city, district, ward, ...restData } = data;
    const address =
      data.address +
      '. ' +
      data.city.label +
      ', ' +
      data.district.label +
      ', ' +
      data.ward.label;

    const orderItems = cartItems.map((c) => ({
      variantId: c.id,
      orderedPrice: c.price,
      orderedQuantity: c.amountInCart,
    }));

    const postData = {
      ...restData,
      address,
      shippingCost: 0,
      totalPrice: totalPrice(cartItems),
      orderItems,
      user: {
        id: session?.userId,
      },
    };

    try {
      setIsLoading(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/order`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      Swal.fire({
        title: 'T???o th??nh c??ng!',
        icon: 'success',
      }).then(async () => {
        router.replace(`/order/${res.data.id}`);
      });

      dispatch(clearCart());
      methods.reset();
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        Swal.fire({
          title: error.response.data.message,
          icon: 'error',
        });
        return;
      }
      Swal.fire({
        title: 'C???p nh???t th???t b???i',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Thanh to??n</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <UserLayout>
        <Container md css={{ mt: 50 }}>
          <Text
            h2
            size={isXs ? 50 : 30}
            css={{
              textAlign: 'center',
              textGradient: '45deg, $purple600 -20%, $pink600 100%',
            }}
            weight='bold'
          >
            THANH TO??N
          </Text>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <Grid.Container gap={isXs ? 2 : 1} alignItems='baseline'>
                <Grid xs={12} md={4}>
                  <Info />
                </Grid>
                <Grid xs={12} md={4}>
                  <Payment />
                </Grid>
                <Grid xs={12} md={4}>
                  <Summary />
                </Grid>
              </Grid.Container>
            </form>
          </FormProvider>
        </Container>
      </UserLayout>
      <style jsx global>{`
        .nextui-radio-point {
          box-shadow: none !important;
          outline: none !important;
        }
        .order-number {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: white;
          background-color: #7828c8;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    options
  );

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
